import { createAdminClient } from '@/lib/supabaseServer'
import { DashboardCharts } from '@/components/admin/DashboardCharts'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-[#c9a84c]/20 p-6">
      <p className="text-[10px] uppercase tracking-widest text-[#c9a84c]/60">{label}</p>
      <p className="mt-2 font-serif text-3xl text-[#c9a84c]">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-[#f4ead1]/40">{sub}</p>}
    </div>
  )
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

  const providerCount: Record<string, number> = {}
  ;(byProvider ?? []).forEach((o) => {
    const p = o.payment_provider ?? 'unknown'
    providerCount[p] = (providerCount[p] ?? 0) + 1
  })

  const regionCount: Record<string, number> = {}
  ;(byRegion ?? []).forEach((o) => {
    const r = o.region ?? 'unknown'
    regionCount[r] = (regionCount[r] ?? 0) + 1
  })

  const revenueByDayMap: Record<string, number> = {}
  ;(recentPaidOrders ?? []).forEach((o) => {
    const day = o.created_at.slice(0, 10)
    revenueByDayMap[day] = (revenueByDayMap[day] ?? 0) + (o.total_eur ?? 0)
  })
  const revenueByDay = Object.entries(revenueByDayMap)
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
      <h1 className="mb-8 font-serif text-2xl text-[#c9a84c]">Dashboard</h1>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={totalOrders ?? 0} />
        <StatCard label="Paid Orders" value={paidOrders ?? 0} sub={`${conversionRate}% conversion`} />
        <StatCard label="Revenue this month" value={`€${monthRevenue.toFixed(2)}`} />
        <StatCard
          label="Total Products"
          value={totalProducts ?? 0}
          sub={`${unreadContacts ?? 0} unread contacts`}
        />
      </div>

      <DashboardCharts
        top5={top5}
        providerCount={providerCount}
        regionCount={regionCount}
        revenueByDay={revenueByDay}
      />
    </div>
  )
}
