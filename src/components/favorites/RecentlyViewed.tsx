'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ProductCard, type ProductCardItem } from '@/components/ProductCard'
import { useCollectionStore } from '@/store/collectionStore'
import { useCollectionHydrated } from '@/store/useStoreHydrated'
import type { Locale } from '@/types'

/** Records the current product and shows the other pieces this visitor opened recently. */
export function RecentlyViewed({ current, locale }: { current: ProductCardItem; locale: Locale }) {
  const t = useTranslations('favorites')
  const hydrated = useCollectionHydrated()
  const recent = useCollectionStore((s) => s.recent)
  const pushRecent = useCollectionStore((s) => s.pushRecent)

  // Wait for hydration, otherwise the stored list would overwrite this push.
  useEffect(() => {
    if (hydrated) pushRecent(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record once per product id
  }, [hydrated, current.id])

  const others = recent.filter((item) => item.id !== current.id).slice(0, 4)
  if (!hydrated || !others.length) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="mt-28 border-t border-gold/15 pt-20"
    >
      <h2 className="heading-display mb-12 text-4xl text-foreground md:text-5xl">{t('recentlyViewed')}</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((item) => (
          <ProductCard key={item.id} product={item} locale={locale} />
        ))}
      </div>
    </motion.section>
  )
}
