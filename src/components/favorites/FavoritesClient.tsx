'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ProductCard, type ProductCardItem } from '@/components/ProductCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { createClient } from '@/lib/supabase'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { useCollectionStore } from '@/store/collectionStore'
import { useCollectionHydrated } from '@/store/useStoreHydrated'
import type { Locale } from '@/types'

const CARD_FIELDS = 'id, slug, name_ru, name_en, name_de, images, condition, year_circa, price_eur'
const EASE = [0.22, 1, 0.36, 1] as const

export function FavoritesClient({ locale }: { locale: Locale }) {
  const t = useTranslations('favorites')
  const tHome = useTranslations('home')
  const hydrated = useCollectionHydrated()
  const favorites = useCollectionStore((s) => s.favorites)
  const removeFavorite = useCollectionStore((s) => s.removeFavorite)
  const clearFavorites = useCollectionStore((s) => s.clearFavorites)
  // ids confirmed as still for sale; null = not checked yet (or the check failed → trust the snapshot)
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null)
  const [fresh, setFresh] = useState<Map<string, ProductCardItem>>(new Map())

  const idsKey = useMemo(() => favorites.map((f) => f.id).sort().join(','), [favorites])

  // Refresh prices / photos and detect pieces that have been sold since they were saved.
  useEffect(() => {
    if (!hydrated || !idsKey) return
    let cancelled = false
    const ids = idsKey.split(',')
    createClient()
      .from('products')
      .select(CARD_FIELDS)
      .in('id', ids)
      .eq('is_available', true)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const rows = data as ProductCardItem[]
        setFresh(new Map(rows.map((row) => [row.id, row])))
        setAvailableIds(new Set(rows.map((row) => row.id)))
      })
    return () => { cancelled = true }
  }, [hydrated, idsKey])

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!favorites.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="flex flex-col items-center gap-6 py-24 text-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 text-gold">
          <Heart size={22} aria-hidden="true" />
        </span>
        <p className="heading-display text-3xl italic text-foreground">{t('empty')}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{t('emptyHint')}</p>
        <Link href="/catalog" className="btn-lux mt-2">{tHome('footerFullCatalog')}</Link>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{favorites.length}</p>
        <button type="button" onClick={clearFavorites} className="link-lux text-[11px] uppercase tracking-[0.2em] text-gold">
          {t('clear')}
        </button>
      </div>

      <motion.div layout className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {favorites.map((saved) => {
            const sold = availableIds !== null && !availableIds.has(saved.id)
            const item = fresh.get(saved.id) ?? saved
            return (
              <motion.div
                key={saved.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {sold ? (
                  <SoldCard item={saved} locale={locale} label={t('unavailable')} removeLabel={t('remove')} onRemove={() => removeFavorite(saved.id)} />
                ) : (
                  <ProductCard product={item} locale={locale} />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function SoldCard({ item, locale, label, removeLabel, onRemove }: {
  item: ProductCardItem
  locale: Locale
  label: string
  removeLabel: string
  onRemove: () => void
}) {
  const name = getLocalizedField(item as unknown as Record<string, string | null | undefined>, 'name', locale)
  return (
    <div className="relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-deep grayscale">
        {item.images?.[0] && <Image src={item.images[0]} alt="" fill sizes="25vw" className="object-cover opacity-60" />}
        <span className="absolute inset-x-4 top-4 bg-card/90 px-2 py-1 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-5 line-clamp-2 font-display text-xl text-muted-foreground line-through decoration-gold/40">{name}</p>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute right-4 top-14 flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-[var(--shadow-lux)] transition-colors hover:text-rose-600"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
