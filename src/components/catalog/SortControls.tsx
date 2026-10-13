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
    router.push(`${pathname}?${url.searchParams.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-[10px] uppercase tracking-[0.18em] text-gold/50 shrink-0">{t('sort')}</label>
      <select
        value={currentSort}
        aria-label={t('sort')}
        onChange={(e) => handleChange(e.target.value)}
        className="border border-gold/25 bg-transparent px-3 py-2 text-xs text-[#c8bfaa]/80 focus:border-gold/50 focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a1f18]">
            {t(`sortOptions.${opt.label}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
