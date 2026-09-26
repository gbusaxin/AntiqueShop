'use client'

import { motion } from 'framer-motion'
import { ProductCard } from '@/components/ProductCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import type { Product } from '@/types'
import type { Locale } from '@/types'

interface ProductGridProps {
  products: Product[]
  locale: Locale
  total: number
  loading?: boolean
}

export function ProductGrid({ products, locale, total, loading }: ProductGridProps) {
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
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-gold/20">
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" />
          <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-sm tracking-wide text-[#c8bfaa]/50">No items match your search</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-6 text-[11px] uppercase tracking-[0.18em] text-gold/50">
        {total} item{total !== 1 ? 's' : ''} found
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4) }}
          >
            <ProductCard product={product} locale={locale} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
