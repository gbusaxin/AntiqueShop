import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'
import { cookies, headers } from 'next/headers'
import { getRegionFromCountryCode, getCookieRegion } from '@/lib/region'
import { getPaymentProvidersForRegion } from '@/lib/getPaymentProvidersForRegion'
import { isPositiveInteger, isValidEmail } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import type { Region } from '@/types'

const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments'

const SHIPPING_COSTS_RUB: Record<string, number> = {
  standard: 3000,
  express: 6500,
}

interface CheckoutItem {
  productId: string
  quantity: number
  priceEur: number
}

interface RequestBody {
  items: CheckoutItem[]
  shippingAddress: Record<string, string>
  email: string
  paymentMethodId: string
  deliveryMethod: 'standard' | 'express'
  locale: string
}

async function getServerRegion(): Promise<Region> {
  const headerStore = await headers()
  const cookieStore = await cookies()

  const cookieRegion = getCookieRegion(cookieStore as Parameters<typeof getCookieRegion>[0])
  if (cookieRegion) return cookieRegion

  const countryCode = headerStore.get('x-vercel-ip-country')
  if (countryCode) return getRegionFromCountryCode(countryCode)

  return 'EU'
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`checkout:yk:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const body: RequestBody = await request.json()
    const { items, shippingAddress, email, paymentMethodId, deliveryMethod, locale } = body

    const region = await getServerRegion()
    const allowedProviders = getPaymentProvidersForRegion(region)

    if (!allowedProviders.includes('yookassa')) {
      return NextResponse.json(
        { error: 'YooKassa is not available for your region' },
        { status: 403 }
      )
    }

    const shopId = process.env.YOOKASSA_SHOP_ID!
    const secretKey = process.env.YOOKASSA_SECRET_KEY!

    if (!shopId || !secretKey) {
      return NextResponse.json({ error: 'YooKassa not configured' }, { status: 500 })
    }

    if (!Array.isArray(items) || items.length === 0 || !isValidEmail(email) || !deliveryMethod) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    for (const item of items) {
      if (!isPositiveInteger(item.quantity)) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 })
      }
    }

    const supabase = createAdminClient()

    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    const userId = user?.id ?? null

    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name_ru, name_en, price_eur, is_available')
      .in(
        'id',
        items.map((i) => i.productId)
      )

    if (!dbProducts || dbProducts.length !== items.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    for (const item of items) {
      const dbProduct = productMap.get(item.productId)
      if (!dbProduct?.is_available) {
        return NextResponse.json(
          { error: `Product ${item.productId} is not available` },
          { status: 409 }
        )
      }
      const priceDiff = Math.abs(dbProduct.price_eur - item.priceEur) / dbProduct.price_eur
      if (priceDiff > 0.02) {
        return NextResponse.json(
          { error: 'Price mismatch — please refresh the page and try again' },
          { status: 409 }
        )
      }
    }

    const exchangeRates = await supabase
      .from('exchange_rates')
      .select('rates')
      .gte('expires_at', new Date().toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    const rubRate: number = (exchangeRates.data?.rates as Record<string, number>)?.RUB ?? 95

    const shippingCostRub = SHIPPING_COSTS_RUB[deliveryMethod] ?? 3000
    const shippingCostEur = shippingCostRub / rubRate

    const serverItemsTotal = items.reduce((sum, i) => {
      const p = productMap.get(i.productId)!
      return sum + p.price_eur * i.quantity
    }, 0)

    const totalEur = serverItemsTotal + shippingCostEur
    const totalRub = parseFloat((serverItemsTotal * rubRate + shippingCostRub).toFixed(2))

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'new',
        user_id: userId,
        region,
        payment_provider: 'yookassa',
        currency: 'RUB',
        total_eur: totalEur,
        total_local: totalRub,
        exchange_rate: rubRate,
        shipping_address: shippingAddress,
        shipping_method: deliveryMethod,
        shipping_cost_eur: shippingCostEur,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    await supabase.from('order_items').insert(
      items.map((item) => {
        const p = productMap.get(item.productId)!
        return {
          order_id: order.id,
          product_id: item.productId,
          product_snapshot: {
            name: p.name_ru ?? p.name_en ?? 'Антикварный предмет',
            price_eur: p.price_eur,
          },
          quantity: item.quantity,
          price_eur: p.price_eur,
        }
      })
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const idempotenceKey = randomUUID()

    const ykMethodMap: Record<string, string> = {
      bank_card: 'bank_card',
      sbp: 'sbp',
      yoo_money: 'yoo_money',
      mir: 'bank_card',
    }

    const ykPaymentType = ykMethodMap[paymentMethodId] ?? 'bank_card'

    const ykResponse = await fetch(YOOKASSA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: totalRub.toFixed(2), currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: `${baseUrl}/${locale}/checkout/success?orderId=${order.id}`,
        },
        payment_method_data: { type: ykPaymentType },
        capture: true,
        description: `Заказ Belle Époque #${order.id.slice(0, 8).toUpperCase()}`,
        metadata: { orderId: order.id },
        receipt: {
          customer: { email },
          items: [
            ...items.map((item) => {
              const p = productMap.get(item.productId)!
              const unitRub = parseFloat((p.price_eur * rubRate).toFixed(2))
              return {
                description: p.name_ru ?? p.name_en ?? 'Антикварный предмет',
                quantity: String(item.quantity),
                amount: { value: unitRub.toFixed(2), currency: 'RUB' },
                vat_code: 1,
              }
            }),
            {
              description: `Доставка (${deliveryMethod})`,
              quantity: '1',
              amount: { value: shippingCostRub.toFixed(2), currency: 'RUB' },
              vat_code: 1,
            },
          ],
        },
      }),
    })

    const ykData = await ykResponse.json()

    if (!ykResponse.ok) {
      console.error('[yookassa]', ykData)
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return NextResponse.json({ error: 'Payment provider error' }, { status: 502 })
    }

    await supabase
      .from('orders')
      .update({ payment_session_id: ykData.id })
      .eq('id', order.id)

    return NextResponse.json({
      url: ykData.confirmation?.confirmation_url ?? null,
      orderId: order.id,
    })
  } catch (err) {
    console.error('[yookassa checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
