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
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="w-full border border-[#c9a84c]/20 bg-transparent px-3 py-2 text-xs text-[#f4ead1] focus:border-[#c9a84c]/60 focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[#0d1f1a]">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || status === currentStatus}
        className="w-full border border-[#c9a84c] bg-[#c9a84c]/10 py-2 text-[11px] uppercase tracking-wider text-[#c9a84c] transition-colors hover:bg-[#c9a84c] hover:text-[#0d1f1a] disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Update Status'}
      </button>
    </div>
  )
}
