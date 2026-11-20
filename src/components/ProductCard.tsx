import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice } from '@/lib/getPriceForRegion'
import type { Product } from '@/types'
import type { Locale } from '@/types'

export type ProductCardItem = Pick<Product, 'id' | 'slug' | 'name_ru' | 'name_en' | 'name_de' | 'images' | 'condition' | 'year_circa' | 'price_eur'>

interface ProductCardProps {
  product: ProductCardItem
  locale: Locale
}

/** Small status dot — colour carries meaning, the label carries the text (readable in both themes). */
const CONDITION_DOT: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-amber-500',
  fair: 'bg-orange-500',
  poor: 'bg-rose-500',
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('product')
  const name = getLocalizedField(product as unknown as Record<string, string | null | undefined>, 'name', locale)
  const conditionLabel = product.condition ? t(`condition.${product.condition}`) : ''
  const [cover, alternate] = product.images ?? []

  return (
    <div className="group relative h-full">
      <Link
        href={`/catalog/${product.slug}`}
        locale={locale}
        data-testid="product-card"
        className="group relative flex h-full flex-col outline-offset-4"
      >
        <div className="frame-gilt relative aspect-[4/5] overflow-hidden bg-deep transition-shadow duration-700 ease-lux group-hover:shadow-[var(--shadow-lux)]">
          {cover ? (
            <>
              <Image
                src={cover}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={`object-cover transition-[transform,opacity] duration-[1200ms] ease-lux group-hover:scale-[1.06] ${alternate ? 'group-hover:opacity-0' : ''}`}
              />
              {alternate && (
                <Image
                  src={alternate}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-[1200ms] ease-lux group-hover:scale-100 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,rgb(var(--gold-rgb)/0.14),transparent_70%)]">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-muted-foreground" aria-hidden="true">
                <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 36l8-8 6 6 8-10 10 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {product.condition && (
            <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 bg-card/90 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${CONDITION_DOT[product.condition] ?? 'bg-gold'}`} />
              {conditionLabel}
            </span>
          )}

          <span
            aria-hidden="true"
            className="absolute bottom-4 right-4 z-10 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-card text-foreground opacity-0 shadow-[var(--shadow-lux)] transition-all duration-500 ease-lux group-hover:translate-y-0 group-hover:opacity-100"
          >
            <ArrowUpRight size={16} />
          </span>
        </div>

        <div className="flex flex-1 flex-col pt-5">
          {product.year_circa && (
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{product.year_circa}</p>
          )}
          <p className="mt-1.5 line-clamp-2 font-display text-xl font-medium leading-snug text-foreground transition-colors duration-500 group-hover:text-gold-rich">
            {name}
          </p>
          <div className="mt-auto flex items-center gap-3 pt-4">
            <span className="h-px flex-1 bg-gold/20 transition-colors duration-500 group-hover:bg-gold/50" />
            <p className="font-serif text-base tracking-wide text-foreground">
              {formatPrice(product.price_eur, 'EUR', locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB')}
            </p>
          </div>
        </div>
      </Link>
      {/* Sibling of the link (a button must not live inside an <a>) */}
      <FavoriteButton item={product} className="absolute right-4 top-4 z-20" />
    </div>
  )
}
