import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'
import { TransitionLink } from '@/components/transitions/ViewTransitions'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { VitrineFrame } from '@/components/ui/VitrineFrame'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice } from '@/lib/getPriceForRegion'
import type { Product } from '@/types'
import type { Locale } from '@/types'

export type ProductCardItem = Pick<Product, 'id' | 'slug' | 'name_ru' | 'name_en' | 'name_de' | 'images' | 'year_circa' | 'price_eur'>

interface ProductCardProps {
  product: ProductCardItem
  locale: Locale
  /** Position in the listing, shown as an auction-style lot number */
  lot?: number
}

export function ProductCard({ product, locale, lot }: ProductCardProps) {
  const tCatalog = useTranslations('catalog')
  const name = getLocalizedField(product as unknown as Record<string, string | null | undefined>, 'name', locale)
  const [cover, alternate] = product.images ?? []

  return (
    <div className="group relative h-full">
      <TransitionLink
        href={`/catalog/${product.slug}`}
        locale={locale}
        data-testid="product-card"
        className="group relative flex h-full flex-col outline-offset-4"
      >
        <VitrineFrame className="frame-gilt relative aspect-[4/5] overflow-hidden bg-deep group-hover:shadow-[var(--shadow-lux)]">
          {/* Travels into the product gallery during the page transition */}
          <div data-vt-photo={product.id} className="absolute inset-0 overflow-hidden">
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
          </div>

          <span
            aria-hidden="true"
            className="absolute bottom-4 right-4 z-10 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-card text-foreground opacity-0 shadow-[var(--shadow-lux)] transition-[transform,opacity] duration-500 ease-lux group-hover:translate-y-0 group-hover:opacity-100"
          >
            <ArrowUpRight size={16} />
          </span>
        </VitrineFrame>

        <div className="flex flex-1 flex-col pt-5">
          {(lot !== undefined || product.year_circa) && (
            <div className="flex items-baseline justify-between gap-3 border-b border-gold/15 pb-2">
              {lot !== undefined && (
                <span className="font-display text-[15px] italic text-gold">
                  {tCatalog('lot')} {String(lot).padStart(3, '0')}
                </span>
              )}
              {product.year_circa && (
                <span className="ml-auto text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{product.year_circa}</span>
              )}
            </div>
          )}
          <p className="mt-3 line-clamp-2 font-display text-[1.35rem] font-medium leading-snug text-foreground transition-colors duration-500 group-hover:text-gold-rich">
            {name}
          </p>
          <div className="mt-auto flex items-center gap-3 pt-4">
            <span className="h-px flex-1 bg-gold/20 transition-colors duration-500 group-hover:bg-gold/50" />
            <p className="font-serif text-base tracking-wide text-foreground">
              {formatPrice(product.price_eur, 'EUR', locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB')}
            </p>
          </div>
        </div>
      </TransitionLink>
      {/* Sibling of the link (a button must not live inside an <a>) */}
      {/* Wrapper positions it: the button itself stays `relative` for its heart-burst animation */}
      <div className="absolute right-4 top-4 z-20">
        <FavoriteButton item={product} />
      </div>
    </div>
  )
}
