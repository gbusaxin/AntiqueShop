import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { syncOrderWithProvider } from '@/lib/paymentProviders'
import { isValidUUID } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * Status of an order for the page the buyer lands on after paying.
 * The order id is an unguessable UUID from the provider's return URL; only the status is revealed.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`checkout:status:${ip}`, 60, 10 * 60 * 1000)
  if (!allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const orderId = new URL(request.url).searchParams.get('orderId')
  if (!isValidUUID(orderId)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  const supabase = createAdminClient()
  const load = () =>
    supabase
      .from('orders')
      .select('id, status, payment_provider, payment_session_id, payment_method')
      .eq('id', orderId)
      .maybeSingle()

  const { data: order } = await load()
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (order.status === 'new' || order.status === 'awaiting_payment') {
    try {
      await syncOrderWithProvider(supabase, order)
    } catch (err) {
      console.error('[checkout status] provider sync failed', orderId, err)
    }
  }

  const { data: fresh } = await load()
  const status = fresh?.status ?? order.status

  // What the conversion tags need once the order is placed: total and the pieces (feed ids)
  let conversion: { value: number; currency: string; items: { id: string; price: number; quantity: number }[] } | null = null
  if (status === 'paid' || status === 'awaiting_payment') {
    const { data: details } = await supabase
      .from('orders')
      .select('total_eur, order_items(quantity, price_eur, product_id, products(sku))')
      .eq('id', orderId)
      .maybeSingle()
    if (details) {
      const items = (details.order_items ?? []) as unknown as {
        quantity: number
        price_eur: number
        product_id: string | null
        products: { sku: string | null } | null
      }[]
      conversion = {
        value: Number(details.total_eur),
        currency: 'EUR',
        items: items.map((i) => ({ id: i.products?.sku || i.product_id || 'item', price: Number(i.price_eur), quantity: i.quantity })),
      }
    }
  }

  return NextResponse.json(
    { status, paymentMethod: fresh?.payment_method ?? null, conversion },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
