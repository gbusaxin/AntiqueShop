'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

const SORT_OPTIONS = [
  { value: 'newest', label: 'newest' },
  { value: 'price_asc', label: 'priceAscending' },
  { value: 'price_desc', label: 'priceDescending' },
]

export function SortControls({ currentSort }: { currentSort: string }) {
  const t = useTranslations('catalog')
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (value: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('sort', value)
    url.searchParams.delete('page')
    router.push(`${pathname}?${url.searchParams.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t('sort')}</label>
      <select
        value={currentSort}
        aria-label={t('sort')}
        onChange={(e) => handleChange(e.target.value)}
        className="field-lux w-auto cursor-pointer pr-8"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {t(`sortOptions.${opt.label}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
