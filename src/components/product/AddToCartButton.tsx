'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Plus, Minus, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
  label: string
  inCartLabel?: string
}

export function AddToCartButton({ product, label, inCartLabel = 'In Cart' }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore()
  const cartItem = items.find((i) => i.product.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  if (quantity > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-0 border border-gold/50"
      >
        <button
          onClick={() => quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1)}
          className="flex h-12 w-12 items-center justify-center text-gold/70 transition-colors hover:bg-gold/10 hover:text-gold-rich"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2 border-x border-gold/30 py-3">
          <Check size={14} className="text-gold-rich" />
          <span className="text-xs uppercase tracking-[0.15em] text-gold/80">{inCartLabel}</span>
          <span className="font-serif text-base text-gold-rich">{quantity}</span>
        </div>
        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          className="flex h-12 w-12 items-center justify-center text-gold/70 transition-colors hover:bg-gold/10 hover:text-gold-rich"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => addItem(product, product.price_eur)}
      className="group flex w-full items-center justify-center gap-3 bg-gold/10 border border-gold/40 px-6 py-4 text-xs uppercase tracking-[0.2em] text-gold/80 transition-all duration-300 hover:bg-gold hover:text-emerald-dark hover:border-gold"
    >
      <ShoppingBag size={16} className="transition-transform group-hover:scale-110" />
      {label}
    </motion.button>
  )
}
