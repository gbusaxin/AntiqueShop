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
  return NextResponse.json(
    { status: fresh?.status ?? order.status, paymentMethod: fresh?.payment_method ?? null },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
