'use client'

import { useEffect, useState } from 'react'
import { useCollectionStore } from './collectionStore'

/** True once the persisted collection (favorites / recently viewed) has been read from localStorage. */
export function useCollectionHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsubscribe = useCollectionStore.persist.onFinishHydration(() => setHydrated(true))
    if (useCollectionStore.persist.hasHydrated()) setHydrated(true)
    return unsubscribe
  }, [])

  return hydrated
}
