import { NextResponse } from 'next/server'
import { prepareOrder, checkoutError } from '@/lib/checkout'
import { cancelOrder } from '@/lib/orders'
import { YOOKASSA_METHOD_TYPES } from '@/lib/getPaymentProvidersForRegion'
import { getProviderAvailability } from '@/lib/paymentConfig'
import { getSiteOrigin } from '@/lib/siteOrigin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments'
// Used only when no fresh rate has been cached by the exchange-rates job
const FALLBACK_RUB_RATE = 95

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`checkout:yk:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) return checkoutError('rate_limited', 429, { 'Retry-After': String(retryAfter) })

  if (!getProviderAvailability().yookassa) {
    console.error('[yookassa checkout] YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY are not set')
    return checkoutError('not_configured', 503)
  }
  const shopId = process.env.YOOKASSA_SHOP_ID as string
  const secretKey = process.env.YOOKASSA_SECRET_KEY as string

  const prepared = await prepareOrder(request, 'yookassa', 'RUB')
  if (prepared instanceof NextResponse) return prepared
  const { supabase, orderId, items, productMap, email, locale, paymentMethodId } = prepared

  try {
    const { data: rates } = await supabase
      .from('exchange_rates')
      .select('rates')
      .gte('expires_at', new Date().toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const rubRate: number = (rates?.rates as Record<string, number> | undefined)?.RUB ?? FALLBACK_RUB_RATE

    // Each line is rounded first: YooKassa rejects receipts whose lines don't add up to the amount
    const unitRub = (productId: string) => Math.round(productMap.get(productId)!.price_eur * rubRate * 100) / 100
    const totalRub = Math.round(items.reduce((sum, i) => sum + unitRub(i.productId) * 100 * i.quantity, 0)) / 100

    await supabase.from('orders').update({ total_local: totalRub, exchange_rate: rubRate }).eq('id', orderId)

    const ykResponse = await fetch(YOOKASSA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
        // One payment per order even if the request is retried
        'Idempotence-Key': `order-${orderId}`,
      },
      body: JSON.stringify({
        amount: { value: totalRub.toFixed(2), currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          // YooKassa returns here after success and after cancellation alike; the page asks for the real status
          return_url: `${getSiteOrigin(request)}/${locale}/checkout/success?orderId=${orderId}`,
        },
        payment_method_data: { type: YOOKASSA_METHOD_TYPES.get(paymentMethodId) ?? 'bank_card' },
        capture: true,
        description: `Заказ VintagEmpire №${orderId.slice(0, 8).toUpperCase()}`,
        metadata: { orderId },
        receipt: {
          customer: { email },
          items: items.map((item) => {
            const p = productMap.get(item.productId)!
            return {
              description: (p.name_ru ?? p.name_en ?? 'Антикварный предмет').slice(0, 128),
              quantity: String(item.quantity),
              amount: { value: unitRub(item.productId).toFixed(2), currency: 'RUB' },
              vat_code: 1,
            }
          }),
        },
      }),
    })

    const ykData = await ykResponse.json()
    if (!ykResponse.ok || !ykData.confirmation?.confirmation_url) {
      console.error('[yookassa checkout]', ykResponse.status, ykData)
      await cancelOrder(supabase, orderId)
      return checkoutError('provider_error', 502)
    }

    await supabase.from('orders').update({ payment_session_id: ykData.id }).eq('id', orderId)
    return NextResponse.json({ url: ykData.confirmation.confirmation_url })
  } catch (err) {
    console.error('[yookassa checkout]', err)
    await cancelOrder(supabase, orderId)
    return checkoutError('server_error', 500)
  }
}
