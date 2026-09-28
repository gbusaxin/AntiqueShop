'use client'

import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(
  () => import('./DashboardCharts').then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded bg-[var(--border)]" />,
  }
)

interface CategoryBar {
  name: string
  count: number
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

export function DashboardChartsClient(props: Props) {
  return <DashboardCharts {...props} />
}
