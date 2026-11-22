import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prepareOrder, checkoutError } from '@/lib/checkout'
import { cancelOrder, CHECKOUT_HOLD_MINUTES } from '@/lib/orders'
import { STRIPE_METHOD_TYPES } from '@/lib/getPaymentProvidersForRegion'
import { getStripe } from '@/lib/paymentProviders'
import { getSiteOrigin } from '@/lib/siteOrigin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// Stripe Checkout locales for the shop's languages
const STRIPE_LOCALES = new Map<string, Stripe.Checkout.SessionCreateParams.Locale>([
  ['ru', 'ru'],
  ['en', 'en'],
  ['de', 'de'],
])

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`checkout:stripe:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) return checkoutError('rate_limited', 429, { 'Retry-After': String(retryAfter) })

  const stripe = getStripe()
  if (!stripe) {
    console.error('[stripe checkout] STRIPE_SECRET_KEY is not set')
    return checkoutError('not_configured', 503)
  }

  const prepared = await prepareOrder(request, 'stripe', 'EUR')
  if (prepared instanceof NextResponse) return prepared
  const { supabase, orderId, items, productMap, email, locale, paymentMethodId } = prepared

  try {
    const origin = getSiteOrigin(request)
    const methodTypes = STRIPE_METHOD_TYPES.get(paymentMethodId) ?? ['card']
    const nameOf = (id: string) => {
      const p = productMap.get(id)!
      return (locale === 'ru' ? p.name_ru : locale === 'de' ? p.name_de : p.name_en) ?? p.name_en ?? p.name_ru ?? 'Antique piece'
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: methodTypes,
        customer_email: email,
        locale: STRIPE_LOCALES.get(locale) ?? 'auto',
        // Klarna and SEPA need the buyer's address; for cards Stripe asks only when the bank requires it
        billing_address_collection: methodTypes.includes('card') ? 'auto' : 'required',
        line_items: items.map((item) => ({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(productMap.get(item.productId)!.price_eur * 100),
            product_data: { name: nameOf(item.productId) },
          },
          quantity: item.quantity,
        })),
        metadata: { orderId },
        payment_intent_data: { metadata: { orderId } },
        // The pieces are held for CHECKOUT_HOLD_MINUTES; the session closes a little earlier
        expires_at: Math.floor(Date.now() / 1000) + (CHECKOUT_HOLD_MINUTES - 5) * 60,
        success_url: `${origin}/${locale}/checkout/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${locale}/checkout/failed?orderId=${orderId}&reason=cancelled`,
      },
      { idempotencyKey: `checkout-${orderId}` }
    )

    if (!session.url) throw new Error('Stripe returned a session without a URL')

    await supabase.from('orders').update({ payment_session_id: session.id }).eq('id', orderId)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe checkout]', err)
    await cancelOrder(supabase, orderId)
    // A method that is switched off in the Stripe dashboard comes back as invalid_request_error
    const isMethodOff = err instanceof Stripe.errors.StripeInvalidRequestError && err.param === 'payment_method_types'
    return checkoutError(isMethodOff ? 'method_unavailable' : 'provider_error', 502)
  }
}
