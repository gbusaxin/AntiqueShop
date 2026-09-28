import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies, headers } from 'next/headers'
import { createAdminClient, createClient } from '@/lib/supabaseServer'
import { getRegionFromCountryCode, getCookieRegion } from '@/lib/region'
import { getPaymentProvidersForRegion } from '@/lib/getPaymentProvidersForRegion'
import { isPositiveInteger, isValidEmail } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import type { Region } from '@/types'

const SHIPPING_COSTS_EUR: Record<string, number> = {
  standard: 35,
  express: 75,
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
  const { allowed, retryAfter } = rateLimit(`checkout-stripe:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

    const body: RequestBody = await request.json()
    const { items, shippingAddress, email, deliveryMethod, locale } = body

    const region = await getServerRegion()
    const allowedProviders = getPaymentProvidersForRegion(region)

    if (!allowedProviders.includes('stripe')) {
      return NextResponse.json(
        { error: 'Stripe is not available for your region' },
        { status: 403 }
      )
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
      .select('id, name_en, name_ru, price_eur, is_available')
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

    const shippingCostEur = SHIPPING_COSTS_EUR[deliveryMethod] ?? 35

    const serverItemsTotal = items.reduce((sum, i) => {
      const p = productMap.get(i.productId)!
      return sum + p.price_eur * i.quantity
    }, 0)

    const totalEur = serverItemsTotal + shippingCostEur

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'new',
        user_id: userId,
        region,
        payment_provider: 'stripe',
        currency: 'EUR',
        total_eur: totalEur,
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
            name: p.name_en ?? p.name_ru ?? 'Antique Item',
            price_eur: p.price_eur,
          },
          quantity: item.quantity,
          price_eur: p.price_eur,
        }
      })
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        ...items.map((item) => {
          const p = productMap.get(item.productId)!
          return {
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(p.price_eur * 100),
              product_data: { name: p.name_en ?? p.name_ru ?? 'Antique Item' },
            },
            quantity: item.quantity,
          }
        }),
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(shippingCostEur * 100),
            product_data: { name: `Shipping (${deliveryMethod})` },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id },
      success_url: `${baseUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${baseUrl}/${locale}/checkout/failed`,
    })

    if (!session.url) {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 })
    }

    await supabase
      .from('orders')
      .update({ payment_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
