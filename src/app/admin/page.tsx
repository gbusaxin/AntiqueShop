import { createAdminClient } from '@/lib/supabaseServer'
import { DashboardChartsClient } from '@/components/admin/DashboardChartsClient'
import Link from 'next/link'
import type { OrderStatus } from '@/types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  new: 'bg-blue-400/10 text-blue-400',
  paid: 'bg-emerald-400/10 text-emerald-400',
  shipped: 'bg-amber-400/10 text-amber-400',
  completed: 'bg-green-400/10 text-green-400',
  cancelled: 'bg-red-400/10 text-red-400',
  refunded: 'bg-red-400/10 text-red-400',
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  href?: string
}) {
  const inner = (
    <div className="border border-[var(--border)] bg-[var(--bg)] p-5 transition-colors hover:border-[var(--accent)]/40">
      <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{label}</p>
      <p className="mt-2 font-serif text-3xl text-[var(--accent)]">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-[var(--fg-muted)]">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    { count: totalOrders },
    { count: paidOrders },
    { data: revenueData },
    { data: topCategories },
    { data: byProvider },
    { data: byRegion },
    { count: totalProducts },
    { count: unreadContacts },
    { data: recentOrders },
    { data: recentPaidOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('orders')
      .select('total_eur')
      .eq('status', 'paid')
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('order_items')
      .select('product_id, products!inner(category_id, categories!inner(name_en, slug))')
      .limit(200),
    supabase.from('orders').select('payment_provider').not('payment_provider', 'is', null),
    supabase.from('orders').select('region'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('contact_requests').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase
      .from('orders')
      .select('id, status, total_eur, region, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('orders')
      .select('created_at, total_eur')
      .eq('status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
  ])

  const monthRevenue = (revenueData ?? []).reduce((sum, o) => sum + (o.total_eur ?? 0), 0)

  type CategoryRef = { slug: string; name_en: string | null }
  type ProductRef = { categories: CategoryRef | null }
  type OrderItemRef = { product_id: string | null; products: ProductRef | null }

  const categoryCount: Record<string, { name: string; count: number }> = {}
  ;(topCategories as unknown as OrderItemRef[] ?? []).forEach((item) => {
    const cat = item.products?.categories
    if (!cat) return
    if (!categoryCount[cat.slug]) categoryCount[cat.slug] = { name: cat.name_en ?? cat.slug, count: 0 }
    categoryCount[cat.slug].count++
  })
  const top5 = Object.values(categoryCount).sort((a, b) => b.count - a.count).slice(0, 5)

  const providerCounts = new Map<string, number>()
  ;(byProvider ?? []).forEach((o) => {
    const p = o.payment_provider ?? 'unknown'
    providerCounts.set(p, (providerCounts.get(p) ?? 0) + 1)
  })
  const providerCount = Object.fromEntries(providerCounts)

  const regionCounts = new Map<string, number>()
  ;(byRegion ?? []).forEach((o) => {
    const r = o.region ?? 'unknown'
    regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1)
  })
  const regionCount = Object.fromEntries(regionCounts)

  const revenueByDayMap = new Map<string, number>()
  ;(recentPaidOrders ?? []).forEach((o) => {
    const day = o.created_at.slice(0, 10)
    revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + (o.total_eur ?? 0))
  })
  const revenueByDay = [...revenueByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date: date.slice(5),
      revenue: Math.round(revenue * 100) / 100,
    }))

  const conversionRate =
    totalOrders && paidOrders
      ? ((paidOrders / totalOrders) * 100).toFixed(1)
      : '0'

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-[var(--fg)]">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={totalOrders ?? 0} href="/admin/orders" />
        <StatCard
          label="Paid Orders"
          value={paidOrders ?? 0}
          sub={`${conversionRate}% conversion`}
          href="/admin/orders?status=paid"
        />
        <StatCard label="Revenue This Month" value={`€${monthRevenue.toFixed(2)}`} />
        <StatCard
          label="Products"
          value={totalProducts ?? 0}
          sub={unreadContacts ? `${unreadContacts} unread messages` : undefined}
          href="/admin/products"
        />
      </div>

      <DashboardChartsClient
        top5={top5}
        providerCount={providerCount}
        regionCount={regionCount}
        revenueByDay={revenueByDay}
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[12px] uppercase tracking-widest text-[var(--fg-muted)]">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-[11px] text-[var(--accent)] hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto border border-[var(--border)]">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Region</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).map((order) => (
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
          {(recentOrders ?? []).length === 0 && (
            <div className="py-16 text-center">
              <p className="text-[var(--fg-muted)]">No orders yet</p>
              <p className="mt-1 text-[12px] text-[var(--fg-muted)]/60">
                Orders will appear here once customers start purchasing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
