'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrderStatus } from '@/types'

const STATUSES: OrderStatus[] = ['new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded']

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (status === currentStatus) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to update')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-[11px] admin-status-red">{error}</p>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="admin-input"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[var(--admin-card)] text-[var(--fg)]">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || status === currentStatus}
        className="admin-primary w-full disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Update Status'}
      </button>
    </div>
  )
}
