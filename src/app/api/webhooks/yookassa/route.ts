import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { createHmac, timingSafeEqual } from 'crypto'

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

  if (event.type === 'payment.succeeded') {
    const payment = event.object
    const orderId = payment.metadata?.orderId

    if (!orderId) {
      console.error('[yookassa webhook] no orderId in metadata')
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_intent_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'new')

    if (error) {
      console.error('[yookassa webhook] failed to update order', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
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
