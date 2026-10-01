import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { createHmac, timingSafeEqual } from 'crypto'
import { sendOrderConfirmation, notifyAdminNewOrder } from '@/lib/email'

function verifyYooKassaSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  try {
    const hmac = createHmac('sha256', secret)
    hmac.update(body)
    const digest = hmac.digest('hex')
    const sigBuf = Buffer.from(signature, 'hex')
    const digestBuf = Buffer.from(digest, 'hex')
    if (sigBuf.length !== digestBuf.length) return false
    return timingSafeEqual(sigBuf, digestBuf)
  } catch {
    return false
  }
}

interface YooKassaEvent {
  type: string
  object: {
    id: string
    status: string
    metadata?: { orderId?: string }
    payment_method?: { type: string }
    amount?: { value: string; currency: string }
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[yookassa webhook] YOOKASSA_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-yookassa-signature')
  if (!verifyYooKassaSignature(body, signature, webhookSecret)) {
    console.error('[yookassa webhook] signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: YooKassaEvent

  try {
    event = JSON.parse(body) as YooKassaEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const eventId = `yookassa:${event.object.id}:${event.type}`

  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({ id: eventId, provider: 'yookassa' })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[yookassa webhook] failed to record event', insertError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (event.type === 'payment.succeeded') {
    const payment = event.object
    const orderId = payment.metadata?.orderId

    if (!orderId) {
      console.error('[yookassa webhook] no orderId in metadata')
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_intent_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'new')
      .select('id, email, total_eur, region, payment_provider, locale, order_items(quantity, price_eur, products(name_en, name_ru, name_de))')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[yookassa webhook] failed to update order', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    if (updatedOrder) {
      const locale = (updatedOrder.locale as string | null) ?? 'ru'
      const items = ((updatedOrder.order_items ?? []) as {
        quantity: number
        price_eur: number
        products: { name_en?: string; name_ru?: string; name_de?: string } | null
      }[]).map((i) => ({
        name: i.products?.name_ru ?? i.products?.name_en ?? i.products?.name_de ?? 'Item',
        quantity: i.quantity,
        priceEur: i.price_eur,
      }))

      await Promise.all([
        sendOrderConfirmation({
          to: updatedOrder.email as string,
          orderNumber: updatedOrder.id as string,
          items,
          totalEur: updatedOrder.total_eur as number,
          locale,
        }),
        notifyAdminNewOrder({
          orderNumber: updatedOrder.id as string,
          totalEur: updatedOrder.total_eur as number,
          region: updatedOrder.region as string,
          provider: updatedOrder.payment_provider as string,
          customerEmail: updatedOrder.email as string,
        }),
      ])
    }
  }

  if (event.type === 'payment.canceled') {
    const payment = event.object
    const orderId = payment.metadata?.orderId

    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'new')
    }
  }

  return NextResponse.json({ received: true })
}
