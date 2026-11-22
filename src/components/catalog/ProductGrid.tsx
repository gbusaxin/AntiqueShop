'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ProductCard, type ProductCardItem } from '@/components/ProductCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import type { Locale } from '@/types'

interface ProductGridProps {
  products: ProductCardItem[]
  locale: Locale
  total: number
  loading?: boolean
  /** Index of the first product on this page, for lot numbers */
  offset?: number
}

export function ProductGrid({ products, locale, total, loading, offset = 0 }: ProductGridProps) {
  const t = useTranslations('catalog')
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="text-gold/40">
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" />
          <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="heading-display text-2xl italic text-muted-foreground">{t('noResults')}</p>
      </div>
    )
  }

  return (
    <div>
      <p data-visual="dynamic" className="sr-only">{t('itemCount', { count: total })}</p>
      <div data-testid="products-grid" className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCard product={product} locale={locale} lot={offset + i + 1} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
