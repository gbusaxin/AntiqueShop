import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabaseServer'
import { sendOrderConfirmation, notifyAdminNewOrder } from '@/lib/email'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (!orderId) {
      console.error('[stripe webhook] no orderId in metadata')
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'new')
      .select('id, email, total_eur, region, payment_provider, locale, order_items(quantity, price_eur, products(name_en, name_ru, name_de))')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[stripe webhook] failed to update order to paid', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    if (updatedOrder) {
      const locale = (updatedOrder.locale as string | null) ?? 'en'
      const items = ((updatedOrder.order_items ?? []) as {
        quantity: number
        price_eur: number
        products: { name_en?: string; name_ru?: string; name_de?: string } | null
      }[]).map((i) => ({
        name: i.products?.name_en ?? i.products?.name_ru ?? i.products?.name_de ?? 'Item',
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

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'new')
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.orderId

    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'new')
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const pi = charge.payment_intent

    if (pi) {
      const piId = typeof pi === 'string' ? pi : pi.id
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('payment_intent_id', piId)
        .in('status', ['paid', 'shipped'])
    }
  }

  return NextResponse.json({ received: true })
}
