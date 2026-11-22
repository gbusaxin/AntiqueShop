// Server-only: asks the payment provider what really happened to an order's payment.
// Used when the buyer comes back from the payment page, so orders settle even before (or without) a webhook.
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabaseServer'
import { cancelOrder, markAwaitingPayment, markOrderPaid } from '@/lib/orders'
import { getStripeSecretKey } from '@/lib/paymentConfig'

type AdminClient = ReturnType<typeof createAdminClient>

export interface OrderPaymentRef {
  id: string
  status: string
  payment_provider: string | null
  payment_session_id: string | null
}

export function getStripe(): Stripe | null {
  const key = getStripeSecretKey()
  return key ? new Stripe(key, { apiVersion: '2025-02-24.acacia' }) : null
}

export interface YooKassaPayment {
  id: string
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  paid: boolean
  metadata?: { orderId?: string }
  amount?: { value: string; currency: string }
}

/** Reads a payment straight from the YooKassa API — the only source we trust for its status */
export async function fetchYooKassaPayment(paymentId: string): Promise<YooKassaPayment | null> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey || !/^[\w-]{10,64}$/.test(paymentId)) return null

  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error('[yookassa] payment lookup failed', paymentId, res.status)
    return null
  }
  return (await res.json()) as YooKassaPayment
}

/** Brings an open order in line with its payment. Safe to call repeatedly. */
export async function syncOrderWithProvider(supabase: AdminClient, order: OrderPaymentRef): Promise<void> {
  if (!order.payment_session_id || (order.status !== 'new' && order.status !== 'awaiting_payment')) return

  if (order.payment_provider === 'stripe') {
    const stripe = getStripe()
    if (!stripe) return
    const session = await stripe.checkout.sessions.retrieve(order.payment_session_id)
    const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)
    if (session.status === 'complete' && session.payment_status === 'paid') {
      await markOrderPaid(supabase, order.id, paymentId, 'en')
    } else if (session.status === 'complete' && order.status === 'new') {
      await markAwaitingPayment(supabase, order.id, paymentId)
    } else if (session.status === 'expired') {
      await cancelOrder(supabase, order.id)
    }
    return
  }

  if (order.payment_provider === 'yookassa') {
    const payment = await fetchYooKassaPayment(order.payment_session_id)
    if (!payment || payment.metadata?.orderId !== order.id) return
    if (payment.status === 'succeeded') await markOrderPaid(supabase, order.id, payment.id, 'ru')
    else if (payment.status === 'canceled') await cancelOrder(supabase, order.id)
  }
}

/**
 * The buyer left the payment page without paying: close the payment so it can't be completed later
 * and free the pieces right away, so they can try again or somebody else can buy them.
 */
export async function abandonOrder(supabase: AdminClient, order: OrderPaymentRef): Promise<void> {
  if (order.status !== 'new') return

  if (order.payment_provider === 'stripe' && order.payment_session_id) {
    const stripe = getStripe()
    if (!stripe) return
    const session = await stripe.checkout.sessions.retrieve(order.payment_session_id)
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(session.id)
      await cancelOrder(supabase, order.id)
    } else {
      await syncOrderWithProvider(supabase, order)
    }
    return
  }

  if (order.payment_provider === 'yookassa' && order.payment_session_id) {
    const payment = await fetchYooKassaPayment(order.payment_session_id)
    // A pending YooKassa payment can't be withdrawn; it expires on its own and a late success still counts
    if (payment?.status === 'succeeded' || payment?.status === 'canceled') {
      await syncOrderWithProvider(supabase, order)
    } else {
      await cancelOrder(supabase, order.id)
    }
  }
}
