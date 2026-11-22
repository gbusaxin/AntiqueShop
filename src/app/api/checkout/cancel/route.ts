import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { abandonOrder } from '@/lib/paymentProviders'
import { isValidUUID } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

/** The buyer pressed "back" on the payment page: close the unpaid payment and free the pieces. */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`checkout:cancel:${ip}`, 20, 60 * 60 * 1000)
  if (!allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let orderId: unknown
  try {
    orderId = (await request.json())?.orderId
  } catch {
    orderId = null
  }
  if (!isValidUUID(orderId)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_provider, payment_session_id')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  try {
    await abandonOrder(supabase, order)
  } catch (err) {
    console.error('[checkout cancel]', orderId, err)
  }

  const { data: fresh } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle()
  return NextResponse.json({ status: fresh?.status ?? order.status })
}
