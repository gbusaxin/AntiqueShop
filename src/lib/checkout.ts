// Server-only: validates a checkout request and creates the order both payment routes start from.
import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabaseServer'
import { getRegionFromCountryCode } from '@/lib/region'
import { getPaymentProvider, isMethodAllowed } from '@/lib/getPaymentProvidersForRegion'
import { getProviderAvailability } from '@/lib/paymentConfig'
import { reserveProducts } from '@/lib/orders'
import { abandonOrder, type OrderPaymentRef } from '@/lib/paymentProviders'
import { isPositiveInteger, isValidEmail, isValidUUID } from '@/lib/validation'
import { routing } from '@/i18n/routing'
import type { PaymentProvider, Region } from '@/types'

interface CheckoutItem {
  productId: string
  quantity: number
  priceEur: number
}

interface CheckoutBody {
  items?: CheckoutItem[]
  shippingAddress?: Record<string, string>
  email?: string
  paymentMethodId?: string
  deliveryMethod?: string
  locale?: string
}

export interface DbProduct {
  id: string
  name_en: string | null
  name_ru: string | null
  name_de: string | null
  price_eur: number
  is_available: boolean
}

export interface PreparedOrder {
  supabase: ReturnType<typeof createAdminClient>
  orderId: string
  items: CheckoutItem[]
  productMap: Map<string, DbProduct>
  email: string
  locale: string
  region: Region
  paymentMethodId: string
}

/** Error codes the checkout form turns into a message for the buyer */
export type CheckoutErrorCode =
  | 'invalid_request'
  | 'method_unavailable'
  | 'not_available'
  | 'reserved'
  | 'price_changed'
  | 'not_configured'
  | 'provider_error'
  | 'server_error'
  | 'rate_limited'

export function checkoutError(code: CheckoutErrorCode, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: code }, { status, headers })
}

const SHIPPING_FIELDS = [
  'country', 'city', 'address_line_1', 'address_line_2', 'postal_code', 'state', 'recipient_name', 'recipient_phone',
] as const

function cleanShippingAddress(raw: Record<string, string> | undefined): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null
  const clean: Record<string, string> = {}
  for (const field of SHIPPING_FIELDS) {
    // eslint-disable-next-line security/detect-object-injection -- field comes from the fixed list above
    const value = raw[field]
    if (typeof value === 'string' && value.trim()) {
      // eslint-disable-next-line security/detect-object-injection -- field comes from the fixed list above
      clean[field] = value.trim().slice(0, 200)
    }
  }
  const required = ['country', 'city', 'address_line_1', 'recipient_name'] as const
  return required.every((f) => f in clean) ? clean : null
}

/**
 * Validates the request against the database, creates the order with its items and holds the pieces.
 * Returns a ready NextResponse when the request can't go on.
 */
export async function prepareOrder(
  request: Request,
  provider: PaymentProvider,
  currency: string
): Promise<PreparedOrder | NextResponse> {
  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return checkoutError('invalid_request', 400)
  }

  const { items, email, paymentMethodId, deliveryMethod } = body
  const shippingAddress = cleanShippingAddress(body.shippingAddress)
  const locale = (routing.locales as readonly string[]).includes(body.locale ?? '')
    ? (body.locale as string)
    : routing.defaultLocale

  if (
    !Array.isArray(items) || items.length === 0 || items.length > 50 ||
    !isValidEmail(email) || !shippingAddress ||
    (deliveryMethod !== 'standard' && deliveryMethod !== 'express') ||
    typeof paymentMethodId !== 'string' ||
    items.some((i) => !isValidUUID(i?.productId) || !isPositiveInteger(i?.quantity) || typeof i?.priceEur !== 'number')
  ) {
    return checkoutError('invalid_request', 400)
  }

  // The provider follows the shipping country — the same rule the checkout form shows the buyer
  const region = getRegionFromCountryCode(shippingAddress.country)
  const availability = getProviderAvailability()
  if (
    getPaymentProvider(region, availability) !== provider ||
    !isMethodAllowed(paymentMethodId, region, availability, shippingAddress.country)
  ) {
    return checkoutError('method_unavailable', 400)
  }

  const supabase = createAdminClient()
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()

  const productIds = [...new Set(items.map((i) => i.productId))]
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, name_en, name_ru, name_de, price_eur, is_available')
    .in('id', productIds)

  if (!dbProducts || dbProducts.length !== productIds.length) {
    return checkoutError('not_available', 409)
  }

  const productMap = new Map<string, DbProduct>(dbProducts.map((p) => [p.id, p as DbProduct]))
  for (const item of items) {
    const product = productMap.get(item.productId)!
    if (!product.is_available) return checkoutError('not_available', 409)
    if (Math.abs(product.price_eur - item.priceEur) / product.price_eur > 0.02) {
      return checkoutError('price_changed', 409)
    }
  }

  const totalEur = items.reduce((sum, i) => sum + productMap.get(i.productId)!.price_eur * i.quantity, 0)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: 'new',
      user_id: user?.id ?? null,
      region,
      payment_provider: provider,
      payment_method: paymentMethodId,
      currency,
      total_eur: totalEur,
      shipping_address: shippingAddress,
      shipping_method: deliveryMethod,
      email,
      locale,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[checkout] failed to create order', orderError)
    return checkoutError('server_error', 500)
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map((item) => {
      const p = productMap.get(item.productId)!
      return {
        order_id: order.id,
        product_id: item.productId,
        product_snapshot: { name: p.name_en ?? p.name_ru ?? 'Antique Item', price_eur: p.price_eur },
        quantity: item.quantity,
        price_eur: p.price_eur,
      }
    })
  )
  if (itemsError) {
    console.error('[checkout] failed to create order items', itemsError)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return checkoutError('server_error', 500)
  }

  let reserved = await reserveProducts(supabase, order.id, productIds)
  // The same buyer came back to pay again (closed the tab, changed the method): drop their unpaid attempt
  if (!reserved && (await releaseOwnAttempts(supabase, email, productIds))) {
    reserved = await reserveProducts(supabase, order.id, productIds)
  }
  if (!reserved) {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return checkoutError('reserved', 409)
  }

  return {
    supabase,
    orderId: order.id,
    items,
    productMap,
    email,
    locale,
    region,
    paymentMethodId,
  }
}

/** Frees pieces held by earlier unpaid checkouts of the same buyer. True when something was freed. */
async function releaseOwnAttempts(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  productIds: string[]
): Promise<boolean> {
  const { data: holds } = await supabase
    .from('product_reservations')
    .select('order_id, orders(id, status, email, payment_provider, payment_session_id)')
    .in('product_id', productIds)
    .gt('expires_at', new Date().toISOString())

  const holders = new Map<string, OrderPaymentRef & { email: string | null }>()
  for (const hold of holds ?? []) {
    const order = (Array.isArray(hold.orders) ? hold.orders[0] : hold.orders) as (OrderPaymentRef & { email: string | null }) | null
    if (order) holders.set(order.id, order)
  }
  if (holders.size === 0) return false

  const own = [...holders.values()].every((o) => o.status === 'new' && o.email?.toLowerCase() === email.toLowerCase())
  if (!own) return false

  for (const order of holders.values()) {
    try {
      await abandonOrder(supabase, order)
    } catch (err) {
      console.error('[checkout] failed to release an earlier attempt', order.id, err)
      return false
    }
  }
  return true
}
