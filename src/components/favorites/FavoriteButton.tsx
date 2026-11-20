'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ProductCardItem } from '@/components/ProductCard'
import { useCollectionStore } from '@/store/collectionStore'
import { useCollectionHydrated } from '@/store/useStoreHydrated'

const BURST = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)

export function FavoriteButton({ item, className = '' }: { item: ProductCardItem; className?: string }) {
  const t = useTranslations('favorites')
  const hydrated = useCollectionHydrated()
  const isFavorite = useCollectionStore((s) => s.favorites.some((fav) => fav.id === item.id))
  const toggleFavorite = useCollectionStore((s) => s.toggleFavorite)
  const active = hydrated && isFavorite

  return (
    <button
      type="button"
      data-testid="favorite-toggle"
      aria-pressed={active}
      aria-label={active ? t('remove') : t('add')}
      title={active ? t('remove') : t('add')}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleFavorite(item)
      }}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-[var(--shadow-lux)] backdrop-blur-sm transition-colors duration-300 hover:text-rose-600 dark:hover:text-rose-400 ${className}`}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={hydrated ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 14 }}
        className="flex"
      >
        <Heart
          size={16}
          aria-hidden="true"
          className={active ? 'fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400' : ''}
        />
      </motion.span>

      <AnimatePresence>
        {active && (
          <motion.span key="burst" aria-hidden="true" className="pointer-events-none absolute inset-0" exit={{ opacity: 0 }}>
            {BURST.map((angle) => (
              <motion.span
                key={angle}
                className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * 18, y: Math.sin(angle) * 18, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
