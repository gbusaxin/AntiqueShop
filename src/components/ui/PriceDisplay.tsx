import {formatPrice} from '@/lib/getPriceForRegion'
import type {PriceInfo} from '@/types'

export function PriceDisplay({price, locale, className}: {price: PriceInfo; locale: string; className?: string}) {
  return <div className={className}><span className="font-serif text-xl tracking-wide">{formatPrice(price.amount, price.currency, locale)}</span>{price.isConverted && <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-emerald-800/65 dark:text-gold-rich/70">≈ EUR</span>}</div>
}
