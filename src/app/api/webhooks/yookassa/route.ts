import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { cancelOrder, markOrderPaid } from '@/lib/orders'
import { fetchYooKassaPayment } from '@/lib/paymentProviders'

interface YooKassaNotification {
  type?: string
  event?: string
  object?: { id?: string }
}

/**
 * YooKassa notifications are not signed. Instead of trusting the body, the payment is read back
 * from the YooKassa API with our own credentials (the approach YooKassa recommends), so a forged
 * notification can at most make us look up a payment that doesn't belong to the shop.
 */
export async function POST(request: Request) {
  let notification: YooKassaNotification
  try {
    notification = (await request.json()) as YooKassaNotification
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const paymentId = notification.object?.id
  if (notification.type !== 'notification' || !paymentId || !notification.event?.startsWith('payment.')) {
    return NextResponse.json({ received: true, ignored: true })
  }

  const payment = await fetchYooKassaPayment(paymentId)
  if (!payment) {
    // Not configured, unknown payment or YooKassa unreachable: a non-2xx makes YooKassa retry later
    return NextResponse.json({ error: 'Payment lookup failed' }, { status: 502 })
  }

  const orderId = payment.metadata?.orderId
  if (!orderId) return NextResponse.json({ received: true, ignored: true })

  const supabase = createAdminClient()
  const eventId = `yookassa:${payment.id}:${payment.status}`

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

  try {
    if (payment.status === 'succeeded') {
      await markOrderPaid(supabase, orderId, payment.id, 'ru')
    } else if (payment.status === 'canceled') {
      await cancelOrder(supabase, orderId)
    }
  } catch (err) {
    console.error('[yookassa webhook] failed to update order', orderId, err)
    await supabase.from('webhook_events').delete().eq('id', eventId)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
