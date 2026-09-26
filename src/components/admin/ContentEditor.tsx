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

  const textareaClass =
    'w-full border border-[#c9a84c]/20 bg-transparent px-3 py-2 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/20 focus:border-[#c9a84c]/60 focus:outline-none resize-y'

  return (
    <div className="border border-[#c9a84c]/15">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#c9a84c]/5"
      >
        <span className="text-xs text-[#f4ead1]/70">{item.section}</span>
        <span className="text-[10px] text-[#c9a84c]/40">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[#c9a84c]/15 p-5">
          {error && <p className="mb-3 text-[11px] text-red-400">{error}</p>}
          {saved && <p className="mb-3 text-[11px] text-emerald-400">Saved!</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'RU', val: ru, set: setRu },
              { label: 'EN', val: en, set: setEn },
              { label: 'DE', val: de, set: setDe },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#c9a84c]/50">
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
              className="border border-[#c9a84c] bg-[#c9a84c]/10 px-5 py-2 text-[11px] uppercase tracking-wider text-[#c9a84c] transition-colors hover:bg-[#c9a84c] hover:text-[#0d1f1a] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
