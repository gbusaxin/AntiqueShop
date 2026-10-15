'use client'

import { useCallback, useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import type { Category, Locale } from '@/types'

const MATERIALS = ['Porcelain', 'Crystal', 'Silver', 'Bronze', 'Copper', 'Glass', 'Wood', 'Ivory']
const CONDITIONS = ['excellent', 'good', 'fair', 'poor'] as const

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gold/15 pb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3 text-xs uppercase tracking-[0.18em] text-gold/70 hover:text-gold-rich transition-colors"
      >
        {label}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function CheckItem({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="flex h-4 w-4 shrink-0 items-center justify-center border border-gold/30 bg-transparent transition-colors data-[state=checked]:border-gold data-[state=checked]:bg-gold/15"
      >
        <Checkbox.Indicator>
          <Check size={10} className="text-gold-rich" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label htmlFor={id} className="cursor-pointer text-xs tracking-wide text-[#c8bfaa]/80 hover:text-[#f4ead1] transition-colors">
        {label}
      </label>
    </div>
  )
}

interface FilterSidebarProps {
  selectedMaterials: string[]
  priceMin: number
  priceMax: number
  condition: string
  categories: Category[]
  categorySlug: string
  search: string
}

export function FilterSidebar({
  selectedMaterials,
  priceMin,
  priceMax,
  condition,
  categories,
  categorySlug,
  search,
}: FilterSidebarProps) {
  const t = useTranslations('catalog')
  const common = useTranslations('common')
  const product = useTranslations('product')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [priceFrom, setPriceFrom] = useState(priceMin ? String(priceMin) : '')
  const [priceTo, setPriceTo] = useState(priceMax ? String(priceMax) : '')
  const [searchInput, setSearchInput] = useState(search)

  const updateParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const url = new URL(window.location.href)
      url.searchParams.delete(key)
      url.searchParams.delete('page')
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v))
        } else {
          url.searchParams.set(key, value)
        }
      }
      router.push(`${pathname}?${url.searchParams.toString()}`)
    },
    [router, pathname]
  )

  const toggleMaterial = (mat: string) => {
    const next = selectedMaterials.includes(mat)
      ? selectedMaterials.filter((m) => m !== mat)
      : [...selectedMaterials, mat]
    updateParam('material', next.length ? next : null)
  }

  const setCondition = (value: string) => {
    updateParam('condition', value === condition ? null : value)
  }

  const filterCount = selectedMaterials.length +
    (condition ? 1 : 0) + (priceMin > 0 || priceMax > 0 ? 1 : 0) +
    (categorySlug ? 1 : 0) + (search ? 1 : 0)
  const hasFilters = filterCount > 0

  const clearAll = () => {
    router.push(pathname)
    setPriceFrom('')
    setPriceTo('')
    setSearchInput('')
  }

  const FiltersContent = (
    <div className="flex flex-col gap-0">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="mb-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gold/60 hover:text-gold-rich transition-colors"
        >
          <X size={10} /> {t('clearAllFilters')}
        </button>
      )}

      <FilterGroup label={common('search')}>
        <form onSubmit={(event) => { event.preventDefault(); updateParam('search', searchInput.trim() || null) }}>
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} className="w-full border border-gold/30 bg-transparent px-2 py-2 text-xs text-white" />
          <button type="submit" className="mt-2 text-xs text-[#c8bfaa] hover:text-white">{common('search')}</button>
        </form>
      </FilterGroup>

      <FilterGroup label={t('filters.category')}>
        <select value={categorySlug} onChange={(event) => updateParam('category', event.target.value || null)} aria-label={t('filters.category')} className="w-full border border-gold/30 bg-[#0a1f18] px-2 py-2 text-xs text-white">
          <option value="">{t('allCategories')}</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{getLocalizedField(category as unknown as Record<string, string | null | undefined>, 'name', locale)}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup label={t('filters.material')}>
        {MATERIALS.map((mat) => (
          <CheckItem
            key={mat}
            label={t(`materials.${mat}`)}
            checked={selectedMaterials.includes(mat)}
            onCheckedChange={() => toggleMaterial(mat)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('priceCurrency', { currency: 'EUR' })}>
        <div className="grid grid-cols-2 gap-2 pb-3">
          <input type="number" min="0" aria-label={t('minimumPrice')} placeholder={t('min')} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} onBlur={() => updateParam('price_min', priceFrom || null)} className="w-full border border-gold/30 bg-transparent px-2 py-2 text-xs text-white" />
          <input type="number" min="0" aria-label={t('maximumPrice')} placeholder={t('max')} value={priceTo} onChange={(e) => setPriceTo(e.target.value)} onBlur={() => updateParam('price_max', priceTo || null)} className="w-full border border-gold/30 bg-transparent px-2 py-2 text-xs text-white" />
        </div>
      </FilterGroup>

      <FilterGroup label={t('filters.condition')}>
        <div className="flex flex-col gap-0">
          {CONDITIONS.map((value) => (
            <div key={value} className="flex items-center gap-2.5 py-1.5">
              <button
                onClick={() => setCondition(value)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  condition === value
                    ? 'border-gold bg-gold/20'
                    : 'border-gold/30 hover:border-gold/60'
                }`}
                aria-label={product(`condition.${value}`)}
                aria-pressed={condition === value}
              >
                {condition === value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-gold-rich" />
                )}
              </button>
              <span className="cursor-pointer text-xs tracking-wide text-[#c8bfaa]/80">{product(`condition.${value}`)}</span>
            </div>
          ))}
        </div>
      </FilterGroup>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className="flex items-center gap-2 border border-gold/30 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-gold/70 transition-colors hover:border-gold hover:text-gold-rich lg:hidden"
      >
        <SlidersHorizontal size={14} />
        {hasFilters ? t('filterCount', { count: filterCount }) : t('filtersTitle')}
      </button>

      {mobileOpen && (
        <div className="rounded border border-gold/15 bg-[#071a12] p-5 lg:hidden">
          {FiltersContent}
        </div>
      )}

      <div className="hidden lg:block">{FiltersContent}</div>
    </>
  )
}
