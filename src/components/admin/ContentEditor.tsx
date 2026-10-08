'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CONTENT_PAGES, ContentText, MarkdownEditor, type ContentItem } from './MarkdownEditor'

const LANGUAGES = ['ru', 'en', 'de'] as const
const CONTACT_FIELDS = [
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'working_hours', label: 'Working hours' },
  { key: 'map_coordinates', label: 'Map coordinates (latitude, longitude)' },
] as const

export function ContentEditor({ item }: { item: ContentItem }) {
  const router = useRouter()
  const [locale, setLocale] = useState<typeof LANGUAGES[number]>('ru')
  const [draft, setDraft] = useState(() => ({
    title_ru: item.title_ru ?? '',
    title_en: item.title_en ?? '',
    title_de: item.title_de ?? '',
    content_ru: item.content_ru ?? '',
    content_en: item.content_en ?? '',
    content_de: item.content_de ?? '',
  }))
  const [metadata, setMetadata] = useState(item.metadata)
  const [id, setId] = useState(item.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const page = CONTENT_PAGES.find((page) => page.key === item.page_key)!
  const titleField = `title_${locale}` as const
  const contentField = `content_${locale}` as const

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${id ?? item.page_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: item.page_key, ...draft, metadata }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save content')
      setId(data.item.id)
      toast.success('Content saved')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-card p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-[var(--fg)]">{page.label}</h2>
        <a href={`/${locale}/${page.path}`} target="_blank" rel="noopener noreferrer" className="admin-secondary">
          Open page ({locale.toUpperCase()})
        </a>
      </div>
      <div role="tablist" aria-label="Content language" className="mb-5 flex gap-2">
        {LANGUAGES.map((language) => (
          <button
            key={language}
            id={`${item.page_key}-tab-${language}`}
            type="button"
            role="tab"
            aria-selected={locale === language}
            aria-controls={`${item.page_key}-panel`}
            onClick={() => setLocale(language)}
            className={locale === language ? 'admin-primary' : 'admin-secondary'}
          >
            {language.toUpperCase()}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mb-3 text-xs admin-status-red">{error}</p>}
      <div role="tabpanel" id={`${item.page_key}-panel`} aria-labelledby={`${item.page_key}-tab-${locale}`} className="space-y-5">
        <div>
          <label htmlFor={`${item.page_key}-title-${locale}`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
            Title ({locale.toUpperCase()})
          </label>
          <input
            id={`${item.page_key}-title-${locale}`}
            value={draft[titleField]}
            onChange={(event) => setDraft({ ...draft, [titleField]: event.target.value })}
            maxLength={300}
            disabled={saving}
            className="admin-input"
          />
        </div>
        <MarkdownEditor
          id={`${item.page_key}-body-${locale}`}
          value={draft[contentField]}
          onChange={(value) => setDraft({ ...draft, [contentField]: value })}
          disabled={saving}
        />
        <details>
          <summary className="cursor-pointer text-xs text-[var(--fg-muted)]">Preview</summary>
          <div className="mt-3 border border-[var(--border)] p-4 text-[var(--fg)]">
            <ContentText content={draft[contentField]} />
          </div>
        </details>
      </div>
      {item.page_key === 'contacts' && (
        <fieldset disabled={saving} className="mt-6 grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm text-[var(--fg)]">Contact details (all languages)</legend>
          {CONTACT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`contacts-${key}`} className="mb-2 block text-xs text-[var(--fg-muted)]">{label}</label>
              <input
                id={`contacts-${key}`}
                value={typeof metadata[key] === 'string' ? metadata[key] as string : ''}
                onChange={(event) => setMetadata({ ...metadata, [key]: event.target.value })}
                maxLength={2000}
                className="admin-input"
              />
            </div>
          ))}
        </fieldset>
      )}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="admin-primary disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
