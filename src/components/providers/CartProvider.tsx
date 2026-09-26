'use client'

import {useEffect, type ReactNode} from 'react'
import {useCartStore} from '@/store/cartStore'

export function CartProvider({children}: {children: ReactNode}) {
  useEffect(() => { useCartStore.persist.rehydrate() }, [])
  return <>{children}</>
}
