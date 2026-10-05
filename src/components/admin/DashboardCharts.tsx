'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const GOLD = '#8B6F47'
const EMERALD = '#357156'
const BURGUNDY = '#9B5C50'

const PIE_COLORS = [GOLD, EMERALD, BURGUNDY, '#4a7c59', '#8b4513']

interface CategoryBar {
  name: string
  count: number
}

interface ProviderEntry {
  name: string
  value: number
}

interface RegionEntry {
  name: string
  value: number
}

interface RevenueEntry {
  date: string
  revenue: number
}

interface Props {
  top5: CategoryBar[]
  providerCount: Record<string, number>
  regionCount: Record<string, number>
  revenueByDay: RevenueEntry[]
}

function customTooltipStyle() {
  return {
    backgroundColor: 'var(--admin-card)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    color: 'var(--fg)',
    fontSize: 11,
  }
}

export function DashboardCharts({ top5, providerCount, regionCount, revenueByDay }: Props) {
  const pieProviderData: ProviderEntry[] = Object.entries(providerCount).map(([name, value]) => ({
    name,
    value,
  }))

  const pieRegionData: RegionEntry[] = Object.entries(regionCount).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {revenueByDay.length > 0 && (
        <div className="admin-card col-span-full p-6">
          <p className="admin-section mb-4">
            Revenue — last 30 days (EUR)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle()}
                cursor={{ fill: 'var(--bg)' }}
                formatter={(v: number) => [`€${v.toFixed(0)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {top5.length > 0 && (
        <div className="admin-card p-6">
          <p className="admin-section mb-4">
            Top Categories
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={top5}
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'var(--fg-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle()}
                cursor={{ fill: 'var(--bg)' }}
              />
              <Bar dataKey="count" fill={EMERALD} radius={[0, 2, 2, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieProviderData.length > 0 && (
        <div className="admin-card p-6">
          <p className="admin-section mb-4">
            Orders by Payment Provider
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieProviderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieProviderData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle()} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieRegionData.length > 0 && (
        <div className="admin-card p-6">
          <p className="admin-section mb-4">
            Orders by Region
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieRegionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieRegionData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle()} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
