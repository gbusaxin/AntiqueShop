'use client'

import {useEffect, type ReactNode} from 'react'
import {useCartStore} from '@/store/cartStore'
import {useCollectionStore} from '@/store/collectionStore'

export function CartProvider({children}: {children: ReactNode}) {
  useEffect(() => {
    useCartStore.persist.rehydrate()
    void useCollectionStore.persist.rehydrate()
  }, [])
  return <>{children}</>
}
