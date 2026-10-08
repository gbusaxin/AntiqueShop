'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Category } from '@/types'
import { RequiredLabel } from './RequiredLabel'
import { CategoryModal } from './CategoryModal'

const requiredText = z.string().trim().min(1, 'Это поле обязательно')
const schema = z.object({
  name_ru: requiredText,
  name_en: z.string().optional(),
  name_de: z.string().optional(),
  description_ru: requiredText,
  description_en: z.string().optional(),
  description_de: z.string().optional(),
  provenance_ru: z.string().optional(),
  provenance_en: z.string().optional(),
  provenance_de: z.string().optional(),
  era: z.string().optional(),
  material: requiredText,
  size: requiredText,
  country_of_origin: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor'], { required_error: 'Это поле обязательно', invalid_type_error: 'Это поле обязательно' }),
  year_circa: z.string().optional(),
  price_eur: z.coerce.number({ invalid_type_error: 'Это поле обязательно' }).positive('Цена должна быть больше нуля'),
  category_id: z.string().uuid('Это поле обязательно'),
  sku: z.union([z.string().regex(/^\d{7}$/, 'SKU должен содержать ровно 7 цифр'), z.literal('')]).optional(),
  is_available: z.boolean(),
})

type FormData = z.infer<typeof schema>
type FieldName = keyof FormData

const requiredFields: { name: FieldName; label: string }[] = [
  { name: 'name_ru', label: 'Name RU' },
  { name: 'description_ru', label: 'Description RU' },
  { name: 'material', label: 'Material' },
  { name: 'size', label: 'Size' },
  { name: 'category_id', label: 'Category' },
  { name: 'price_eur', label: 'Price EUR' },
  { name: 'condition', label: 'Condition' },
]

interface ProductFormProps {
  categories: Category[]
  initialData?: Partial<FormData> & { id?: string; images?: string[] }
  mode: 'create' | 'edit'
}

function Field({ label, required, error, children }: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <RequiredLabel required={required}>{label}</RequiredLabel>
      {children}
      {error && <p role="alert" className="mt-1 text-[11px] text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}

const inputCls = 'admin-input'
const invalidCls = 'border-red-600 dark:border-red-400'

export function ProductForm({ categories, initialData, mode }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoryOptions, setCategoryOptions] = useState(categories)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const formSchema = schema.refine((values) => mode === 'create' || /^\d{7}$/.test(values.sku ?? ''), {
    path: ['sku'],
    message: 'SKU должен содержать ровно 7 цифр',
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name_ru: initialData?.name_ru ?? '',
      name_en: initialData?.name_en ?? '',
      name_de: initialData?.name_de ?? '',
      description_ru: initialData?.description_ru ?? '',
      description_en: initialData?.description_en ?? '',
      description_de: initialData?.description_de ?? '',
      provenance_ru: initialData?.provenance_ru ?? '',
      provenance_en: initialData?.provenance_en ?? '',
      provenance_de: initialData?.provenance_de ?? '',
      era: initialData?.era ?? '',
      material: initialData?.material ?? '',
      size: initialData?.size ?? '',
      country_of_origin: initialData?.country_of_origin ?? '',
      condition: initialData?.condition,
      year_circa: initialData?.year_circa ?? '',
      price_eur: initialData?.price_eur ?? undefined,
      category_id: initialData?.category_id ?? '',
      sku: initialData?.sku ?? undefined,
      is_available: initialData?.is_available ?? true,
    },
  })

  const values = watch()
  const missing = requiredFields.filter(({ name }) => {
    const value = values[name]
    return value === '' || value === null || value === undefined || (name === 'price_eur' && (Number.isNaN(Number(value)) || Number(value) <= 0))
  })
  const hasErrors = Object.keys(errors).length > 0
  const submitDisabled = saving || missing.length > 0 || hasErrors
  const tooltip = missing.length ? `Заполните: ${missing.map(({ label }) => label).join(', ')}` : hasErrors ? `Исправьте: ${Object.keys(errors).join(', ')}` : ''

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(event.target.files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        const response = await fetch('/api/admin/upload', { method: 'POST', body: form })
        if (!response.ok) throw new Error('Upload failed')
        const result = await response.json()
        urls.push(result.url)
      } catch {
        toast.error(`Не удалось загрузить ${file.name}`)
      }
    }
    setUploadedImages((previous) => [...previous, ...urls])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...data, sku: mode === 'create' ? undefined : data.sku, images: uploadedImages }
      const response = await fetch(mode === 'create' ? '/api/admin/products' : `/api/admin/products/${initialData?.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const result = await response.json()
        setError(result.error ?? 'Не удалось сохранить товар')
        toast.error(result.error ?? 'Не удалось сохранить товар')
        return
      }
      toast.success(mode === 'create' ? 'Товар создан' : 'Изменения сохранены')
      router.push('/admin/products')
      router.refresh()
    } catch {
      setError('Ошибка сети')
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initialData?.id || !confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${initialData.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Товар удалён')
      router.push('/admin/products')
      router.refresh()
    } catch {
      toast.error('Не удалось удалить товар')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-8 p-5 sm:p-8">
      {error && <p role="alert" className="border border-red-700/40 bg-red-500/10 px-4 py-3 text-xs text-red-800 dark:text-red-300">{error}</p>}

      <section>
        <h2 className="admin-section mb-5">Names</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Name RU" required error={errors.name_ru?.message}>
            <input {...register('name_ru')} className={`${inputCls} ${errors.name_ru ? invalidCls : ''}`} aria-invalid={!!errors.name_ru} />
          </Field>
          <Field label="Name EN"><input {...register('name_en')} className={inputCls} /></Field>
          <Field label="Name DE"><input {...register('name_de')} className={inputCls} /></Field>
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Descriptions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['ru', 'en', 'de'] as const).map((language) => {
            const field = `description_${language}` as const
            return (
              <Field key={language} label={`Description ${language.toUpperCase()}`} required={language === 'ru'} error={errors[field]?.message}>
                <textarea {...register(field)} rows={4} className={`${inputCls} resize-y ${errors[field] ? invalidCls : ''}`} aria-invalid={!!errors[field]} />
              </Field>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Material" required error={errors.material?.message}>
            <input {...register('material')} className={`${inputCls} ${errors.material ? invalidCls : ''}`} aria-invalid={!!errors.material} />
          </Field>
          <Field label="Size" required error={errors.size?.message}>
            <input {...register('size')} className={`${inputCls} ${errors.size ? invalidCls : ''}`} aria-invalid={!!errors.size} />
          </Field>
          <Field label="Category" required error={errors.category_id?.message}>
            <select {...register('category_id')} className={`${inputCls} ${errors.category_id ? invalidCls : ''}`} aria-invalid={!!errors.category_id}>
              <option value="">— Select —</option>
              {categoryOptions.filter((category) => category.is_active || category.id === initialData?.category_id).map((category) => (
                <option key={category.id} value={category.id}>{category.name_en || category.name_ru || category.slug}</option>
              ))}
            </select>
            <button type="button" onClick={() => setCategoryModalOpen(true)} className="mt-2 text-[11px] font-medium text-[var(--admin-accent-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F47]">+ Create category</button>
          </Field>
          <Field label="Price EUR" required error={errors.price_eur?.message}>
            <input {...register('price_eur')} type="number" min="0.01" step="0.01" className={`${inputCls} ${errors.price_eur ? invalidCls : ''}`} aria-invalid={!!errors.price_eur} />
          </Field>
          <Field label="Condition" required error={errors.condition?.message}>
            <select {...register('condition')} className={`${inputCls} ${errors.condition ? invalidCls : ''}`} aria-invalid={!!errors.condition}>
              <option value="">— Select —</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </Field>
          <Field label="Era"><input {...register('era')} className={inputCls} placeholder="Art Deco" /></Field>
          <Field label="Country of Origin"><input {...register('country_of_origin')} className={inputCls} placeholder="France" /></Field>
          <Field label="Year / Circa"><input {...register('year_circa')} className={inputCls} placeholder="1920s" /></Field>
          <Field label="SKU" error={errors.sku?.message}>
            {mode === 'create' ? (
              <input disabled value="" className={`${inputCls} font-mono`} placeholder="Будет сгенерирован автоматически" />
            ) : (
              <input {...register('sku')} inputMode="numeric" maxLength={7} className={`${inputCls} font-mono ${errors.sku ? invalidCls : ''}`} placeholder="1234567" aria-invalid={!!errors.sku} />
            )}
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
        <h2 className="admin-section mb-5">Provenance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['ru', 'en', 'de'] as const).map((language) => (
            <Field key={language} label={`Provenance ${language.toUpperCase()}`}>
              <textarea {...register(`provenance_${language}`)} rows={3} className={`${inputCls} resize-y`} />
            </Field>
          ))}
        </div>
      </section>

      <section>
        <h2 className="admin-section mb-5">Images</h2>
        {uploadedImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {uploadedImages.map((url) => (
              <div key={url} className="relative group">
                <Image src={url} alt="" width={96} height={96} className="h-24 w-24 border border-[var(--border)] object-cover" />
                <button type="button" aria-label="Remove image" onClick={() => setUploadedImages((previous) => previous.filter((image) => image !== url))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-800 text-xs text-white hover:bg-red-950">×</button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFileUpload} className="sr-only peer" id="image-upload" />
        <label htmlFor="image-upload" className={`inline-block cursor-pointer border-2 border-dashed border-[var(--accent)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-accent-text)] hover:bg-[var(--bg)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)] ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
          {uploading ? 'Uploading…' : '+ Upload Photos'}
        </label>
        <p className="mt-2 text-[11px] text-[var(--fg-muted)]">JPEG, PNG, WEBP, AVIF — max 8MB each</p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
        {mode === 'edit' && <button type="button" onClick={handleDelete} disabled={deleting} className="border border-red-700 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-red-800 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300">{deleting ? 'Deleting…' : 'Delete Product'}</button>}
        <div className="ml-auto flex gap-3">
          <button type="button" onClick={() => router.push('/admin/products')} className="admin-secondary">Cancel</button>
          <span title={tooltip}>
            <button type="submit" disabled={submitDisabled} className="admin-primary disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}</button>
          </span>
        </div>
      </div>
    </form>
    <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} onSaved={(category) => {
      setCategoryOptions((previous) => [...previous, category])
      setValue('category_id', category.id, { shouldValidate: true, shouldDirty: true })
    }} />
    </>
  )
}
