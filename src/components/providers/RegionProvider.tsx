'use client'

import {useEffect, type ReactNode} from 'react'
import {useRegionStore} from '@/store/regionStore'
import type {Region} from '@/types'

const REGIONS = new Set(['EU', 'CIS', 'US', 'UK', 'OTHER'])

export function RegionProvider({children}: {children: ReactNode}) {
  useEffect(() => {
    // No saved choice yet: start from the region the server guessed on the first visit (cookie)
    const hadChoice = (() => {
      try {
        return localStorage.getItem('region-storage') !== null
      } catch {
        return true
      }
    })()
    useRegionStore.persist.rehydrate()
    if (!hadChoice) {
      const guessed = document.cookie.match(/(?:^|;\s*)user_region=([^;]+)/)?.[1]
      if (guessed && REGIONS.has(decodeURIComponent(guessed))) {
        useRegionStore.getState().setRegion(decodeURIComponent(guessed) as Region)
      }
    }
  }, [])
  return <>{children}</>
}
