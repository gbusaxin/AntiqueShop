import { createAdminClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import type { OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'text-blue-400 bg-blue-400/10',
  paid: 'text-emerald-400 bg-emerald-400/10',
  shipped: 'text-amber-400 bg-amber-400/10',
  completed: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}

const STATUSES: OrderStatus[] = ['new', 'paid', 'shipped', 'completed', 'cancelled']

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('orders')
    .select('id, status, region, payment_provider, total_eur, currency, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status && STATUSES.includes(status as OrderStatus)) {
    query = query.eq('status', status)
  }

  const { data: orders } = await query

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-[#c9a84c]">Orders</h1>

      <div className="mb-6 flex gap-2">
        <Link
          href="/admin/orders"
          className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${!status ? 'border border-[#c9a84c] text-[#c9a84c]' : 'border border-[#c9a84c]/20 text-[#f4ead1]/40 hover:border-[#c9a84c]/40'}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${status === s ? 'border border-[#c9a84c] text-[#c9a84c]' : 'border border-[#c9a84c]/20 text-[#f4ead1]/40 hover:border-[#c9a84c]/40'}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#c9a84c]/20 text-[10px] uppercase tracking-widest text-[#c9a84c]/60">
              <th className="pb-3 pr-4 text-left">Order ID</th>
              <th className="pb-3 pr-4 text-left">Status</th>
              <th className="pb-3 pr-4 text-left">Region</th>
              <th className="pb-3 pr-4 text-left">Provider</th>
              <th className="pb-3 pr-4 text-left">Total</th>
              <th className="pb-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr
                key={order.id}
                className="border-b border-[#c9a84c]/10 transition-colors hover:bg-[#c9a84c]/5"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-[#c9a84c]/80 hover:text-[#c9a84c]"
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_COLORS[order.status as OrderStatus]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[#f4ead1]/60">{order.region}</td>
                <td className="py-3 pr-4 capitalize text-[#f4ead1]/60">
                  {order.payment_provider ?? '—'}
                </td>
                <td className="py-3 pr-4 text-[#c9a84c]">
                  €{Number(order.total_eur).toFixed(2)}
                </td>
                <td className="py-3 text-[#f4ead1]/40">
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(orders ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-[#f4ead1]/30">No orders found</p>
        )}
      </div>
    </div>
  )
}
