'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ShoppingBag, Plus, Minus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { trackEcommerce } from '@/lib/analytics'
import type { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
  label: string
  inCartLabel?: string
}

export function AddToCartButton({ product, label, inCartLabel }: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { items, addItem, updateQuantity, removeItem } = useCartStore()
  const cartItem = items.find((i) => i.product.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  if (quantity > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-0 border border-gold/50 bg-card"
      >
        <button
          onClick={() => quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1)}
          className="flex h-12 w-12 items-center justify-center text-gold transition-colors hover:bg-gold/10 hover:text-gold-rich"
          aria-label={t('decreaseQuantity')}
        >
          <Minus size={14} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2 border-x border-gold/30 py-3">
          <Check size={14} className="text-gold-rich" />
          <span className="text-xs uppercase tracking-[0.15em] text-gold">{inCartLabel ?? t('inCart')}</span>
          <span className="font-serif text-base text-gold-rich">{quantity}</span>
        </div>
        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          className="flex h-12 w-12 items-center justify-center text-gold transition-colors hover:bg-gold/10 hover:text-gold-rich"
          aria-label={t('increaseQuantity')}
        >
          <Plus size={14} />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.button
      data-testid="add-to-cart"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        addItem(product, product.price_eur)
        toast.success(t('addedToCart'))
        trackEcommerce('add_to_cart', {
          value: product.price_eur,
          items: [{ id: product.sku || product.id, name: product.name_en ?? product.name_ru ?? product.slug, price: product.price_eur }],
        })
      }}
      className="btn-lux group w-full !py-5"
    >
      <ShoppingBag size={16} aria-hidden="true" className="transition-transform duration-500 ease-lux group-hover:-rotate-6 group-hover:scale-110" />
      {label}
    </motion.button>
  )
}
