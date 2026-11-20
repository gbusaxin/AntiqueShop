'use client'

import { useCallback, useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
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
        className="flex w-full items-center justify-between py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:text-gold"
      >
        {label}
        <ChevronDown size={13} aria-hidden="true" className={`text-gold transition-transform duration-500 ease-lux ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-lux ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden" inert={!open || undefined}>
          <div className="pt-2">{children}</div>
        </div>
      </div>
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
        className="flex h-4 w-4 shrink-0 items-center justify-center border border-gold/40 bg-card transition-all duration-300 hover:border-gold data-[state=checked]:border-gold data-[state=checked]:bg-gold"
      >
        <Checkbox.Indicator>
          <Check size={10} strokeWidth={3} className="text-[var(--bg)]" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label htmlFor={id} className="cursor-pointer text-[13px] tracking-wide text-muted-foreground transition-colors hover:text-foreground">
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
          className="mb-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gold transition-colors hover:text-gold-rich"
        >
          <X size={10} /> {t('clearAllFilters')}
        </button>
      )}

      <FilterGroup label={common('search')}>
        <form onSubmit={(event) => { event.preventDefault(); updateParam('search', searchInput.trim() || null) }}>
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} className="field-lux" />
          <button type="submit" className="link-lux mt-3 text-[11px] uppercase tracking-[0.2em] text-gold">{common('search')}</button>
        </form>
      </FilterGroup>

      <FilterGroup label={t('filters.category')}>
        <select value={categorySlug} onChange={(event) => updateParam('category', event.target.value || null)} aria-label={t('filters.category')} className="field-lux cursor-pointer">
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
          <input type="number" min="0" aria-label={t('minimumPrice')} placeholder={t('min')} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} onBlur={() => updateParam('price_min', priceFrom || null)} className="field-lux" />
          <input type="number" min="0" aria-label={t('maximumPrice')} placeholder={t('max')} value={priceTo} onChange={(e) => setPriceTo(e.target.value)} onBlur={() => updateParam('price_max', priceTo || null)} className="field-lux" />
        </div>
      </FilterGroup>

      <FilterGroup label={t('filters.condition')}>
        <div className="flex flex-col gap-0">
          {CONDITIONS.map((value) => (
            <div key={value} className="flex items-center gap-2.5 py-1.5">
              <button
                onClick={() => setCondition(value)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  condition === value
                    ? 'border-gold bg-gold/15'
                    : 'border-gold/40 hover:border-gold'
                }`}
                aria-label={product(`condition.${value}`)}
                aria-pressed={condition === value}
              >
                {condition === value && (
                  <div className="h-2 w-2 rounded-full bg-gold" />
                )}
              </button>
              <span className="text-[13px] tracking-wide text-muted-foreground">{product(`condition.${value}`)}</span>
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
        className="btn-ghost !px-5 !py-3 lg:hidden"
      >
        <SlidersHorizontal size={14} />
        {hasFilters ? t('filterCount', { count: filterCount }) : t('filtersTitle')}
      </button>

      {mobileOpen && (
        <div className="mt-3 border border-gold/20 bg-card p-5 shadow-[var(--shadow-lux)] lg:hidden">
          {FiltersContent}
        </div>
      )}

      <div className="hidden lg:block">{FiltersContent}</div>
    </>
  )
}
