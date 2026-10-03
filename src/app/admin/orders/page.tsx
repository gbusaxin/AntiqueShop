import { createAdminClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import type { OrderStatus } from '@/types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  new: 'bg-blue-400/10 text-blue-400',
  paid: 'bg-emerald-400/10 text-emerald-400',
  shipped: 'bg-amber-400/10 text-amber-400',
  completed: 'bg-green-400/10 text-green-400',
  cancelled: 'bg-red-400/10 text-red-400',
  refunded: 'bg-red-400/10 text-red-400',
}

const STATUSES: OrderStatus[] = ['new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded']

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; region?: string; provider?: string }>
}) {
  const { status, region, provider } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('orders')
    .select('id, status, region, payment_provider, total_eur, currency, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && STATUSES.includes(status as OrderStatus)) {
    query = query.eq('status', status)
  }
  if (region) query = query.eq('region', region)
  if (provider) query = query.eq('payment_provider', provider)

  const { data: orders } = await query

  const { data: allOrders } = await supabase.from('orders').select('region, payment_provider')
  const regions = [...new Set((allOrders ?? []).map((o) => o.region).filter(Boolean))]
  const providers = [...new Set((allOrders ?? []).map((o) => o.payment_provider).filter(Boolean))]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { status, region, provider, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const str = params.toString()
    return `/admin/orders${str ? `?${str}` : ''}`
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-[var(--fg)]">Orders</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
            !status && !region && !provider
              ? 'border border-[var(--accent)] text-[var(--accent)]'
              : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
              status === s
                ? 'border border-[var(--accent)] text-[var(--accent)]'
                : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
            }`}
          >
            {s}
          </Link>
        ))}

        {regions.length > 0 && (
          <div className="ml-2 flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--fg-muted)]">Region:</span>
            {regions.map((r) => (
              <Link
                key={r}
                href={buildUrl({ region: region === r ? undefined : r })}
                className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  region === r
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {r}
              </Link>
            ))}
          </div>
        )}

        {providers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--fg-muted)]">Provider:</span>
            {providers.map((p) => (
              <Link
                key={p}
                href={buildUrl({ provider: provider === p ? undefined : p })}
                className={`px-2 py-1 text-[10px] capitalize tracking-wider transition-colors ${
                  provider === p
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        <span className="ml-auto text-[11px] text-[var(--fg-muted)]">
          {(orders ?? []).length} orders
        </span>
      </div>

      <div className="overflow-x-auto border border-[var(--border)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left">Provider</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr
                key={order.id}
                className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--accent)]/5"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-[var(--accent)] hover:underline"
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_BADGE[order.status as OrderStatus] ?? ''}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--fg-muted)]">{order.region ?? '—'}</td>
                <td className="px-4 py-3 capitalize text-[var(--fg-muted)]">
                  {order.payment_provider ?? '—'}
                </td>
                <td className="px-4 py-3 text-[var(--accent)]">
                  €{Number(order.total_eur).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-[var(--fg-muted)]">
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
          <div className="py-20 text-center">
            <ShoppingCart size={36} className="mx-auto mb-3 text-[var(--fg-muted)]/30" />
            <p className="text-[var(--fg-muted)]">No orders found</p>
            <p className="mt-1 text-[12px] text-[var(--fg-muted)]/60">
              {status || region || provider
                ? 'Try removing some filters.'
                : 'Orders will appear here once customers start purchasing.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
