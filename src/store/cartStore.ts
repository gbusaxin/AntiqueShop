import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

export interface CartItem {
  product: Product
  quantity: number
  priceEur: number
}

interface CartState {
  items: CartItem[]
  totalEur: number
  totalItems: number
  addItem: (product: Product, priceEur: number, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

function getTotals(items: CartItem[]) {
  return {
    totalEur: items.reduce((total, item) => total + item.priceEur * item.quantity, 0),
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalEur: 0,
      totalItems: 0,
      addItem: (product, priceEur, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.product.id === product.id)
          const items = existingItem
            ? state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [...state.items, { product, priceEur, quantity }]

          return { items, ...getTotals(items) }
        }),
      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((item) => item.product.id !== productId)
          return { items, ...getTotals(items) }
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const safeQuantity = Math.max(1, Math.floor(quantity))
          const items = state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity: safeQuantity } : item
          )
          return { items, ...getTotals(items) }
        }),
      clearCart: () => set({ items: [], totalEur: 0, totalItems: 0 }),
    }),
    { name: 'cart-storage' }
  )
)
