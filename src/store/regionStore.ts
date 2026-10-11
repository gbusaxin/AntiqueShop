import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Region } from '@/types'
import { REGION_CURRENCIES } from '@/lib/region'

const regionCurrencies = new Map<string, string>(Object.entries(REGION_CURRENCIES))

interface RegionState {
  region: Region
  currency: string
  setRegion: (region: Region) => void
}

function saveRegionCookie(region: Region) {
  if (typeof document !== 'undefined') {
    document.cookie = `user_region=${encodeURIComponent(region)}; path=/; max-age=31536000; samesite=lax`
  }
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: 'EU',
      currency: REGION_CURRENCIES.EU,
      setRegion: (region) => {
        saveRegionCookie(region)
        set({ region, currency: regionCurrencies.get(region) ?? REGION_CURRENCIES.EU })
      },
    }),
    { name: 'region-storage' }
  )
)
