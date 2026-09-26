'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useSearchParams } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1f18] px-4 text-center text-[#f4ead1]">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
        className="mb-8 flex h-20 w-20 items-center justify-center border border-gold/30"
      >
        <motion.svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-gold-rich"
        >
          <motion.path
            d="M7 18L14 25L29 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Order Confirmed</p>
        <h1 className="font-serif text-3xl text-gold-rich md:text-4xl">Thank You!</h1>

        {orderId && (
          <p className="text-xs tracking-wide text-gold/60">
            Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
        )}

        <div className="mx-auto mt-2 h-px w-12 bg-gold/30" />

        <p className="max-w-sm text-xs leading-relaxed tracking-wide text-[#c8bfaa]/65">
          Your order will be processed within 24 hours. We will contact you with shipping details and to confirm any provenance documentation.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
          <Link
            href="/account/orders"
            className="border border-gold/30 px-8 py-3 text-xs uppercase tracking-[0.2em] text-gold/70 transition-colors hover:border-gold hover:text-gold-rich"
          >
            View My Orders
          </Link>
          <Link
            href="/catalog"
            className="border border-gold/15 px-8 py-3 text-xs uppercase tracking-[0.2em] text-gold/50 transition-colors hover:border-gold/30 hover:text-gold/70"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
