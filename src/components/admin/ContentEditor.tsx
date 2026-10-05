'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContentItem {
  id: string
  page: string
  section: string
  content_ru: string | null
  content_en: string | null
  content_de: string | null
}

export function ContentEditor({ item }: { item: ContentItem }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [ru, setRu] = useState(item.content_ru ?? '')
  const [en, setEn] = useState(item.content_en ?? '')
  const [de, setDe] = useState(item.content_de ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_ru: ru, content_en: en, content_de: de }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed')
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const textareaClass = 'admin-input resize-y'

  return (
    <div className="admin-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[var(--accent)]/5"
      >
        <span className="text-xs text-[var(--fg)]">{item.section}</span>
        <span className="text-[10px] text-[var(--admin-accent-text)]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-5">
          {error && <p className="mb-3 text-[11px] admin-status-red">{error}</p>}
          {saved && <p className="mb-3 text-[11px] admin-status-green">Saved!</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'RU', val: ru, set: setRu },
              { label: 'EN', val: en, set: setEn },
              { label: 'DE', val: de, set: setDe },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
                  {label}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  rows={5}
                  className={textareaClass}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="admin-primary disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
