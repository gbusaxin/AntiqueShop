import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabaseServer'
import { cancelOrder, markAwaitingPayment, markOrderPaid } from '@/lib/orders'
import { getStripe } from '@/lib/paymentProviders'

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret || !webhookSecret.startsWith('whsec_') || webhookSecret === 'whsec_...') {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({ id: event.id, provider: 'stripe' })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[stripe webhook] failed to record event', insertError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  try {
    switch (event.type) {
      // Cards, wallets and Klarna are paid here; SEPA is only confirmed and settles days later
      case 'checkout.session.completed': {
        const session = event.data.object
        const orderId = session.metadata?.orderId
        if (!orderId) break
        if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
          await markOrderPaid(supabase, orderId, paymentIntentId(session), 'en')
        } else {
          await markAwaitingPayment(supabase, orderId, paymentIntentId(session))
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        const orderId = session.metadata?.orderId
        if (orderId) await markOrderPaid(supabase, orderId, paymentIntentId(session), 'en')
        break
      }

      // SEPA bounced, or the buyer never paid: the pieces go back on sale
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const orderId = event.data.object.metadata?.orderId
        if (orderId) await cancelOrder(supabase, orderId)
        break
      }

      case 'charge.refunded': {
        const pi = event.data.object.payment_intent
        if (pi) {
          await supabase
            .from('orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('payment_intent_id', typeof pi === 'string' ? pi : pi.id)
            .in('status', ['paid', 'shipped', 'completed'])
        }
        break
      }
    }
  } catch (err) {
    console.error(`[stripe webhook] failed to handle ${event.type}`, err)
    // Forget the event so Stripe's retry is processed instead of skipped as a duplicate
    await supabase.from('webhook_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
