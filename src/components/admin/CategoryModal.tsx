'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

export interface AdminCategory {
  id: string
  slug: string
  name_ru: string
  name_en: string
  name_de: string | null
  description_ru: string | null
  description_en: string | null
  description_de: string | null
  sort_order: number
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  product_count?: number
}

export interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: AdminCategory | null
  onSaved: (category: AdminCategory) => void
}

const LANGUAGES = [
  { code: 'en', label: 'English', required: true },
  { code: 'ru', label: 'Russian', required: true },
  { code: 'de', label: 'German', required: false },
] as const

export function CategoryModal({ open, onOpenChange, category, onSaved }: CategoryModalProps) {
  const [saving, setSaving] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!saving) onOpenChange(nextOpen) }}>
      <Dialog.Portal>
        <div className="admin-theme text-[var(--fg)]">
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content
            className="admin-card fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5 shadow-xl sm:p-8"
            onOpenAutoFocus={() => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null }}
            onCloseAutoFocus={(event) => { if (returnFocus.current?.isConnected) { event.preventDefault(); returnFocus.current.focus() } }}
            onEscapeKeyDown={(event) => { if (saving) event.preventDefault() }}
            onInteractOutside={(event) => { if (saving) event.preventDefault() }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--admin-accent-text)]">Catalog organisation</p>
                <Dialog.Title className="font-serif text-2xl sm:text-3xl">{category ? 'Edit category' : 'New category'}</Dialog.Title>
                <Dialog.Description className="mt-2 text-xs leading-relaxed text-[var(--fg-muted)]">
                  Name your collection in each language and choose how it appears in the catalog.
                </Dialog.Description>
              </div>
              <Dialog.Close disabled={saving} aria-label="Close category editor" className="p-2 text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-50">
                <X size={18} aria-hidden="true" />
              </Dialog.Close>
            </div>
            {open && <CategoryFields key={category?.id ?? 'new'} category={category} saving={saving} setSaving={setSaving} onOpenChange={onOpenChange} onSaved={onSaved} />}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CategoryFields({ category, saving, setSaving, onOpenChange, onSaved }: Omit<CategoryModalProps, 'open'> & { saving: boolean; setSaving: (saving: boolean) => void }) {
  const id = useId()
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(Boolean(category))
  const [nameEn, setNameEn] = useState(category?.name_en ?? '')
  const [error, setError] = useState<string | null>(null)

  function updateEnglishName(value: string) {
    setNameEn(value)
    if (!slugEdited) {
      setSlug(value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100))
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const nameRu = String(form.get('name_ru') ?? '').trim()
    if (!nameEn.trim() || !nameRu) {
      setError('English and Russian names are required.')
      return
    }
    const payload = {
      slug: slug.trim(),
      name_en: nameEn.trim(),
      name_ru: nameRu,
      name_de: String(form.get('name_de') ?? '').trim() || null,
      description_en: String(form.get('description_en') ?? '').trim() || null,
      description_ru: String(form.get('description_ru') ?? '').trim() || null,
      description_de: String(form.get('description_de') ?? '').trim() || null,
      image_url: String(form.get('image_url') ?? '').trim() || null,
      is_active: form.get('is_active') === 'on',
      sort_order: form.get('sort_order') === '' ? undefined : Number(form.get('sort_order')),
    }
    setSaving(true)
    setError(null)
    let savedCategory: AdminCategory
    try {
      const response = await fetch(category ? `/api/admin/categories/${category.id}` : '/api/admin/categories', {
        method: category ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.category) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to save category. Please try again.')
      savedCategory = data.category
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Unable to save category. Please try again.'
      setError(message)
      toast.error(message)
      setSaving(false)
      return
    }
    setSaving(false)
    toast.success(category ? 'Category updated' : 'Category created')
    onSaved(savedCategory)
    onOpenChange(false)
  }

  return (
    <form onSubmit={save} className="space-y-6" aria-busy={saving}>
      <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
        <div>
          <label htmlFor={`${id}-slug`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider">Slug <span aria-hidden="true">*</span></label>
          <input id={`${id}-slug`} name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value) }} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" aria-describedby={`${id}-slug-hint`} className="admin-input" placeholder="decorative-objects" autoCapitalize="none" spellCheck={false} />
          <p id={`${id}-slug-hint`} className="mt-2 text-xs text-[var(--fg-muted)]">Unique catalog address. Use lowercase letters, numbers and hyphens.</p>
        </div>
        {LANGUAGES.map(({ code, label, required }) => (
          <section key={code} className="space-y-3 border-t border-[var(--border)] pt-5" aria-labelledby={`${id}-${code}-heading`}>
            <h3 id={`${id}-${code}-heading`} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-accent-text)]">{label} <span className="font-normal text-[var(--fg-muted)]">{required ? '· Required name' : '· Optional'}</span></h3>
            <div>
              <label htmlFor={`${id}-name-${code}`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider">Name {required && <span aria-hidden="true">*</span>}</label>
              {code === 'en' ? (
                <input id={`${id}-name-en`} name="name_en" value={nameEn} onChange={(event) => updateEnglishName(event.target.value)} required maxLength={200} className="admin-input" />
              ) : (
                <input id={`${id}-name-${code}`} name={`name_${code}`} defaultValue={code === 'ru' ? category?.name_ru ?? '' : category?.name_de ?? ''} required={required} maxLength={200} className="admin-input" />
              )}
            </div>
            <div>
              <label htmlFor={`${id}-description-${code}`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider">Description</label>
              <textarea id={`${id}-description-${code}`} name={`description_${code}`} defaultValue={(code === 'en' ? category?.description_en : code === 'ru' ? category?.description_ru : category?.description_de) ?? ''} maxLength={5000} rows={3} className="admin-input resize-y" />
            </div>
          </section>
        ))}
        <div className="space-y-5 border-t border-[var(--border)] pt-5">
          <div>
            <label htmlFor={`${id}-order`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider">Sort order</label>
            <input id={`${id}-order`} name="sort_order" type="number" min={0} max={1000000} step={1} defaultValue={category?.sort_order ?? ''} className="admin-input" placeholder="Automatic" />
          </div>
          <div>
            <label htmlFor={`${id}-image`} className="mb-2 block text-[11px] font-medium uppercase tracking-wider">Image URL <span className="font-normal text-[var(--fg-muted)]">· Optional</span></label>
            <input id={`${id}-image`} name="image_url" type="url" pattern="https://.*" defaultValue={category?.image_url ?? ''} className="admin-input" aria-describedby={`${id}-image-hint`} />
            <p id={`${id}-image-hint`} className="mt-2 text-xs text-[var(--fg-muted)]">Use an HTTPS address for an existing category image.</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-xs">
            <input name="is_active" type="checkbox" defaultChecked={category?.is_active ?? true} className="mt-0.5 h-4 w-4 accent-[#8B6F47]" />
            <span><span className="block font-medium">Active in catalog</span><span className="mt-1 block text-[var(--fg-muted)]">Inactive categories are hidden from catalog navigation.</span></span>
          </label>
        </div>
      </fieldset>
      {error && <p role="alert" className="admin-status-red border border-current p-3 text-xs">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-5">
        <button type="button" onClick={() => onOpenChange(false)} disabled={saving} className="admin-secondary disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving} className="admin-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {saving && <Loader2 size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
          {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </button>
      </div>
    </form>
  )
}
