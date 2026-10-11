'use client'

import { useRef, useState } from 'react'
import { ContactsMap } from '@/components/contacts/ContactsMap'
import { contactMetadataSchema, getContactMapSettings } from '@/components/contacts/mapSettings'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CONTENT_PAGES, ContentText, MarkdownEditor, type ContentItem } from './MarkdownEditor'

const LANGUAGES = ['ru', 'en', 'de'] as const
const CONTACT_FIELDS = [
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'working_hours', label: 'Working hours' },
] as const
const MAP_FIELDS = [
  { key: 'latitude', label: 'Latitude', min: -90, max: 90, step: 'any' },
  { key: 'longitude', label: 'Longitude', min: -180, max: 180, step: 'any' },
  { key: 'zoom', label: 'Zoom', min: 1, max: 19, step: '1' },
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
  const [mapDraft, setMapDraft] = useState(() => {
    const settings = getContactMapSettings(item.metadata)
    return {
      latitude: String(item.metadata.latitude ?? settings?.latitude ?? ''),
      longitude: String(item.metadata.longitude ?? settings?.longitude ?? ''),
      zoom: String(item.metadata.zoom ?? settings?.zoom ?? 14),
    }
  })
  const [geocoding, setGeocoding] = useState(false)
  const geocodePending = useRef(false)
  const [id, setId] = useState(item.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const page = CONTENT_PAGES.find((page) => page.key === item.page_key)!
  const titleField = `title_${locale}` as const
  const contentField = `content_${locale}` as const
  const titleValue = locale === 'ru' ? draft.title_ru : locale === 'de' ? draft.title_de : draft.title_en
  const contentValue = locale === 'ru' ? draft.content_ru : locale === 'de' ? draft.content_de : draft.content_en

  const mapMetadata = {
    ...metadata,
    map_coordinates: undefined,
    latitude: mapDraft.latitude.trim() ? Number(mapDraft.latitude) : undefined,
    longitude: mapDraft.longitude.trim() ? Number(mapDraft.longitude) : undefined,
    zoom: mapDraft.zoom.trim() ? Number(mapDraft.zoom) : undefined,
  }
  const mapValidation = contactMetadataSchema.safeParse(mapMetadata)
  const mapError = mapValidation.success ? null : mapValidation.error.issues[0].message
  const mapSettings = mapValidation.success ? getContactMapSettings(mapValidation.data) : null

  async function geocodeAddress() {
    if (saving || geocodePending.current) return
    geocodePending.current = true
    setGeocoding(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: metadata.address }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to locate address')
      const settings = getContactMapSettings({ latitude: data.latitude, longitude: data.longitude })
      if (!settings) throw new Error('Invalid coordinates returned')
      setMapDraft((current) => ({ ...current, latitude: String(settings.latitude), longitude: String(settings.longitude) }))
      toast.success('Location found. Save to publish it.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error'
      setError(message)
      toast.error(message)
    } finally {
      geocodePending.current = false
      setGeocoding(false)
    }
  }

  async function save() {
    if (saving || geocodePending.current) return
    if (item.page_key === 'contacts' && mapError) {
      setError(mapError)
      toast.error(mapError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${id ?? item.page_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: item.page_key, ...draft, metadata: item.page_key === 'contacts' ? mapValidation.data : metadata }),
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
            value={titleValue}
            onChange={(event) => setDraft({ ...draft, [titleField]: event.target.value })}
            maxLength={300}
            disabled={saving}
            className="admin-input"
          />
        </div>
        <MarkdownEditor
          id={`${item.page_key}-body-${locale}`}
          value={contentValue}
          onChange={(value) => setDraft({ ...draft, [contentField]: value })}
          disabled={saving}
        />
        <details>
          <summary className="cursor-pointer text-xs text-[var(--fg-muted)]">Preview</summary>
          <div className="mt-3 border border-[var(--border)] p-4 text-[var(--fg)]">
            <ContentText content={contentValue} />
          </div>
        </details>
      </div>
      {item.page_key === 'contacts' && (
        <fieldset disabled={saving || geocoding} className="mt-6 grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm text-[var(--fg)]">Contact details (all languages)</legend>
          {CONTACT_FIELDS.map(({ key, label }) => {
            const value = key === 'address' ? metadata.address : key === 'phone' ? metadata.phone : key === 'email' ? metadata.email : metadata.working_hours
            return (
              <div key={key}>
                <label htmlFor={`contacts-${key}`} className="mb-2 block text-xs text-[var(--fg-muted)]">{label}</label>
                <input
                  id={`contacts-${key}`}
                  value={typeof value === 'string' ? value : ''}
                  onChange={(event) => setMetadata({ ...metadata, [key]: event.target.value })}
                  maxLength={2000}
                  className="admin-input"
                />
              </div>
            )
          })}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geocoding || typeof metadata.address !== 'string' || metadata.address.trim().length < 3}
              className="admin-secondary disabled:opacity-50"
            >
              {geocoding ? 'Finding location…' : 'Find address on map'}
            </button>
            <p className="mt-2 text-xs text-[var(--fg-muted)]">Address lookup uses OpenStreetMap Nominatim. You can also enter coordinates manually.</p>
          </div>
          {MAP_FIELDS.map(({ key, label, min, max, step }) => {
            const value = key === 'latitude' ? mapDraft.latitude : key === 'longitude' ? mapDraft.longitude : mapDraft.zoom
            return (
              <div key={key}>
                <label htmlFor={`contacts-${key}`} className="mb-2 block text-xs text-[var(--fg-muted)]">{label}</label>
                <input
                  id={`contacts-${key}`}
                  type="number"
                  value={value}
                  onChange={(event) => setMapDraft((current) => ({ ...current, [key]: event.target.value }))}
                  min={min}
                  max={max}
                  step={step}
                  aria-invalid={Boolean(mapError)}
                  aria-describedby="contacts-map-help"
                  className="admin-input"
                />
              </div>
            )
          })}
          <div id="contacts-map-help" className="sm:col-span-2">
            {mapError ? (
              <p role="alert" className="text-xs admin-status-red">{mapError}</p>
            ) : (
              <p className="text-xs text-[var(--fg-muted)]">Latitude: -90 to 90. Longitude: -180 to 180. Zoom: 1–19. Leave both coordinates empty to hide the map.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="mb-3 text-sm text-[var(--fg)]">Live map preview</p>
            {mapSettings ? <ContactsMap settings={mapSettings} locale={locale} /> : <p className="text-xs text-[var(--fg-muted)]">Enter valid coordinates or look up an address to preview the map.</p>}
          </div>
        </fieldset>
      )}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={save} disabled={saving || geocoding} className="admin-primary disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
