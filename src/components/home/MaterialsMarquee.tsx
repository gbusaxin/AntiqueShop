'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const MATERIALS = ['Porcelain', 'Crystal', 'Pewter', 'Faience', 'Silver', 'Glass', 'Ceramic', 'Wood'] as const

function Ornament() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-gold" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

/** Endless ribbon of materials; each one is a shortcut into the filtered catalogue. */
export function MaterialsMarquee() {
  const t = useTranslations('catalog')

  const renderRow = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {MATERIALS.map((material, i) => (
        <li key={material} className="flex items-center gap-10 md:gap-14">
          <Link
            href={`/catalog?material=${material}`}
            tabIndex={hidden ? -1 : undefined}
            className={`heading-display whitespace-nowrap text-4xl italic transition-colors duration-500 md:text-6xl ${
              i % 2 === 0
                ? 'text-foreground/85 hover:text-gold'
                : 'text-transparent [-webkit-text-stroke:1px_rgb(var(--gold-rgb)/0.7)] hover:text-gold'
            }`}
          >
            {t(`materials.${material}`)}
          </Link>
          <Ornament />
        </li>
      ))}
    </ul>
  )

  return (
    <section data-testid="materials-marquee" aria-label={t('filters.material')} className="mask-fade-x group relative overflow-hidden border-y border-gold/15 bg-deep/60 py-8 md:py-10">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        {renderRow(false)}
        {renderRow(true)}
      </div>
    </section>
  )
}
