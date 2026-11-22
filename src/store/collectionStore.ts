import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCardItem } from '@/components/ProductCard'

const MAX_FAVORITES = 60
const MAX_RECENT = 12

interface CollectionState {
  /** Snapshots of saved pieces — refreshed from Supabase on the favorites page. */
  favorites: ProductCardItem[]
  /** Most recently opened product pages, newest first. */
  recent: ProductCardItem[]
  toggleFavorite: (item: ProductCardItem) => void
  removeFavorite: (id: string) => void
  replaceFavorites: (items: ProductCardItem[]) => void
  clearFavorites: () => void
  pushRecent: (item: ProductCardItem) => void
}

/** Keep only the fields a product card needs, so localStorage stays small and predictable. */
export function toCardItem(item: ProductCardItem): ProductCardItem {
  return {
    id: item.id,
    slug: item.slug,
    name_ru: item.name_ru,
    name_en: item.name_en,
    name_de: item.name_de,
    images: (item.images ?? []).slice(0, 2),
    year_circa: item.year_circa,
    price_eur: item.price_eur,
  }
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      toggleFavorite: (item) =>
        set((state) => {
          const exists = state.favorites.some((fav) => fav.id === item.id)
          return {
            favorites: exists
              ? state.favorites.filter((fav) => fav.id !== item.id)
              : [toCardItem(item), ...state.favorites].slice(0, MAX_FAVORITES),
          }
        }),
      removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter((fav) => fav.id !== id) })),
      replaceFavorites: (items) => set({ favorites: items.map(toCardItem) }),
      clearFavorites: () => set({ favorites: [] }),
      pushRecent: (item) =>
        set((state) => ({
          recent: [toCardItem(item), ...state.recent.filter((r) => r.id !== item.id)].slice(0, MAX_RECENT),
        })),
    }),
    {
      name: 'collection-storage',
      version: 1,
      // Hydrated manually after mount (see CartProvider) so server and client markup match.
      skipHydration: true,
      partialize: (state) => ({ favorites: state.favorites, recent: state.recent }),
    }
  )
)
