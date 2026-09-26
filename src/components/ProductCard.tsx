import { Link } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice } from '@/lib/getPriceForRegion'
import type { Product } from '@/types'
import type { Locale } from '@/types'

interface ProductCardProps {
  product: Product
  locale: Locale
}

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400 border-emerald-400/40',
  very_good: 'text-emerald-300 border-emerald-300/40',
  good: 'text-amber-400 border-amber-400/40',
  fair: 'text-orange-400 border-orange-400/40',
}

const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
  fair: 'Fair',
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const name = getLocalizedField(product as unknown as Record<string, string | null | undefined>, 'name', locale)
  const conditionClass = product.condition ? CONDITION_COLORS[product.condition] : 'text-gold/50 border-gold/20'
  const conditionLabel = product.condition ? CONDITION_LABELS[product.condition] : ''

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group relative flex flex-col overflow-hidden border border-gold/15 bg-white/5 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_8px_32px_rgba(184,134,11,0.12)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-dark/30">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-gold/20">
              <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 36l8-8 6 6 8-10 10 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {product.era && (
          <span className="absolute left-3 top-3 bg-emerald-dark/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold/80 backdrop-blur-sm">
            {product.era}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-serif text-sm leading-snug text-[#f4ead1] line-clamp-2">{name}</p>
          {product.condition && (
            <span className={`shrink-0 border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${conditionClass}`}>
              {conditionLabel}
            </span>
          )}
        </div>

        {product.year_circa && (
          <p className="text-[11px] tracking-wide text-gold/50">{product.year_circa}</p>
        )}

        <p className="mt-auto pt-3 font-serif text-base tracking-wide text-gold-rich">
          {formatPrice(product.price_eur, 'EUR', locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB')}
        </p>
      </div>
    </Link>
  )
}
