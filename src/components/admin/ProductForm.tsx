'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category } from '@/types'

const schema = z.object({
  name_ru: z.string().optional(),
  name_en: z.string().optional(),
  name_de: z.string().optional(),
  description_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_de: z.string().optional(),
  provenance_ru: z.string().optional(),
  provenance_en: z.string().optional(),
  provenance_de: z.string().optional(),
  era: z.string().optional(),
  material: z.string().optional(),
  country_of_origin: z.string().optional(),
  condition: z.enum(['excellent', 'very_good', 'good', 'fair']).optional(),
  year_circa: z.string().optional(),
  price_eur: z.coerce.number().min(0.01),
  category_id: z.string().optional(),
  is_available: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  categories: Category[]
  initialData?: Partial<FormData> & { id?: string; images?: string[] }
  mode: 'create' | 'edit'
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
        <span className="mb-2 block">{label}</span>
        {children}
      </label>
      {error && <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}

const inputCls =
  'admin-input'

export function ProductForm({ categories, initialData, mode }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const { url } = await res.json()
          newUrls.push(url)
        }
      } catch {}
    }
    setUploadedImages((prev) => [...prev, ...newUrls])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(url: string) {
    setUploadedImages((prev) => prev.filter((u) => u !== url))
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? {},
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...data,
        images: uploadedImages,
      }

      const url =
        mode === 'create' ? '/api/admin/products' : `/api/admin/products/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        return
      }

      router.push('/admin/products')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${initialData.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete')
        return
      }
      router.push('/admin/products')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-8 p-5 sm:p-8">
      {error && (
        <div className="border border-red-700/40 bg-red-500/10 px-4 py-3 text-xs text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <section>
        <h2 className="admin-section mb-5">Names</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Name RU" error={errors.name_ru?.message}>
            <input {...register('name_ru')} className={inputCls} />
          </Field>
          <Field label="Name EN" error={errors.name_en?.message}>
            <input {...register('name_en')} className={inputCls} />
          </Field>
          <Field label="Name DE" error={errors.name_de?.message}>
            <input {...register('name_de')} className={inputCls} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Descriptions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['ru', 'en', 'de'] as const).map((lang) => (
            <Field key={lang} label={`Description ${lang.toUpperCase()}`}>
              <textarea
                {...register(`description_${lang}`)}
                rows={4}
                className={`${inputCls} resize-y`}
              />
            </Field>
          ))}
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Provenance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['ru', 'en', 'de'] as const).map((lang) => (
            <Field key={lang} label={`Provenance ${lang.toUpperCase()}`}>
              <textarea
                {...register(`provenance_${lang}`)}
                rows={3}
                className={`${inputCls} resize-y`}
              />
            </Field>
          ))}
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Era">
            <input {...register('era')} className={inputCls} placeholder="Art Deco" />
          </Field>
          <Field label="Material">
            <input {...register('material')} className={inputCls} placeholder="Porcelain" />
          </Field>
          <Field label="Country of Origin">
            <input {...register('country_of_origin')} className={inputCls} placeholder="France" />
          </Field>
          <Field label="Year / Circa">
            <input {...register('year_circa')} className={inputCls} placeholder="1920s" />
          </Field>
          <Field label="Condition" error={errors.condition?.message}>
            <select {...register('condition')} className={inputCls}>
              <option value="">— Select —</option>
              <option value="excellent">Excellent</option>
              <option value="very_good">Very Good</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </Field>
          <Field label="Category">
            <select {...register('category_id')} className={inputCls}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en ?? c.name_ru ?? c.slug}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price EUR" error={errors.price_eur?.message}>
            <input {...register('price_eur')} type="number" step="0.01" className={inputCls} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--fg)]">
              <input {...register('is_available')} type="checkbox" className="h-4 w-4 accent-[#765A37]" />
              Available for sale
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Images</h2>

        {uploadedImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {uploadedImages.map((url) => (
              <div key={url} className="relative group">
                <Image
                  src={url}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 border border-[var(--border)] object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-800 text-xs text-white transition-colors hover:bg-red-950"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileUpload}
            className="sr-only peer"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-block cursor-pointer border-2 border-dashed border-[var(--accent)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-accent-text)] transition-colors hover:bg-[var(--bg)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? 'Uploading…' : '+ Upload Photos'}
          </label>
          <p className="mt-2 text-[11px] text-[var(--fg-muted)]">JPEG, PNG, WEBP, AVIF — max 8MB each</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="border border-red-700 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-red-800 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300"
          >
            {deleting ? 'Deleting…' : 'Delete Product'}
          </button>
        )}
        <div className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="admin-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
