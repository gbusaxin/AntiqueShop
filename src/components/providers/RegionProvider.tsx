'use client'

import {useEffect, type ReactNode} from 'react'
import {useRegionStore} from '@/store/regionStore'

export function RegionProvider({children}: {children: ReactNode}) {
  useEffect(() => { useRegionStore.persist.rehydrate() }, [])
  return <>{children}</>
}
