'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useRegionStore } from '@/store/regionStore'
import { formatPrice } from '@/lib/getPriceForRegion'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { getPaymentProvidersForRegion } from '@/lib/getPaymentProvidersForRegion'
import type { Locale } from '@/types'

const SHIPPING_EST = 35

interface CartContentProps {
  locale: Locale
}

export function CartContent({ locale }: CartContentProps) {
  const { items, totalEur, removeItem, updateQuantity } = useCartStore()
  const { region } = useRegionStore()
  const providers = getPaymentProvidersForRegion(region)

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-32">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <ShoppingBag size={56} className="text-gold/20" />
        </motion.div>
        <div className="text-center">
          <p className="font-serif text-xl text-gold/50">Your cart is empty</p>
          <p className="mt-2 text-xs tracking-wide text-[#c8bfaa]/40">
            Discover exceptional antique objects in our collection
          </p>
        </div>
        <Link
          href="/catalog"
          className="border border-gold/40 px-8 py-3 text-xs uppercase tracking-[0.2em] text-gold/70 transition-colors hover:border-gold hover:text-gold-rich"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
      <div>
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const name = getLocalizedField(
              item.product as unknown as Record<string, string | null | undefined>,
              'name',
              locale
            )
            return (
              <motion.div
                key={item.product.id}
                data-testid="cart-item"
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="flex gap-5 border-b border-gold/10 py-6"
              >
                <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-emerald-dark/30">
                  {item.product.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag size={20} className="text-gold/20" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {item.product.era && (
                        <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50">{item.product.era}</p>
                      )}
                      <Link
                        href={`/catalog/${item.product.slug}`}
                        className="font-serif text-sm leading-snug text-[#f4ead1] hover:text-gold-rich transition-colors"
                      >
                        {name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="shrink-0 text-gold/30 transition-colors hover:text-red-400"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-gold/20">
                      <button
                        onClick={() =>
                          item.quantity === 1
                            ? removeItem(item.product.id)
                            : updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-gold/50 transition-colors hover:text-gold-rich"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs text-[#f4ead1]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-gold/50 transition-colors hover:text-gold-rich"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-serif text-base text-gold-rich">
                      {formatPrice(item.priceEur * item.quantity, 'EUR', localeStr)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <div className="mt-6">
          <Link
            href="/catalog"
            className="text-[10px] uppercase tracking-[0.18em] text-gold/50 hover:text-gold-rich transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 h-fit">
        <div className="border border-gold/15 p-6">
          <p className="mb-6 font-serif text-lg text-gold-rich">Order Summary</p>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between tracking-wide">
              <span className="text-[#c8bfaa]/70">Subtotal</span>
              <span className="text-[#f4ead1]">{formatPrice(totalEur, 'EUR', localeStr)}</span>
            </div>
            <div className="flex justify-between tracking-wide">
              <span className="text-[#c8bfaa]/70">Shipping</span>
              <span className="text-[#c8bfaa]/50 text-[10px]">Calculated at checkout</span>
            </div>
            <div className="border-t border-gold/10 pt-3">
              <div className="flex justify-between">
                <span className="uppercase tracking-[0.15em] text-gold/70">Total</span>
                <span className="font-serif text-lg text-gold-rich">{formatPrice(totalEur + SHIPPING_EST, 'EUR', localeStr)}</span>
              </div>
              <p className="mt-1 text-right text-[10px] text-gold/40">
                incl. est. shipping €{SHIPPING_EST}
              </p>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center border border-gold bg-gold/10 py-4 text-xs uppercase tracking-[0.2em] text-gold-rich transition-all duration-300 hover:bg-gold hover:text-emerald-dark"
          >
            Proceed to Checkout
          </Link>

          <div className="mt-6 border-t border-gold/10 pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-gold/40">Accepted Payments</p>
            <div className="flex flex-wrap gap-2">
              {providers.includes('stripe') && (
                <>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">Card</span>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">Apple Pay</span>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">Google Pay</span>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">SEPA</span>
                </>
              )}
              {providers.includes('yookassa') && (
                <>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">МИР</span>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">СБП</span>
                  <span className="border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-wider text-gold/50">ЮMoney</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
