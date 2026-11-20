'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useSearchParams } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const t = useTranslations('checkout.success')
  const checkoutT = useTranslations('checkout')
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <title>{`${t('title')} — VintagEmpire`}</title>
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
        <p className="eyebrow">{t('title')}</p>
        <h1 className="heading-display text-5xl text-foreground md:text-6xl">{t('heading')}</h1>

        {orderId && (
          <p className="text-xs tracking-wide text-muted-foreground">
            {t('orderReference', { orderId: orderId.slice(0, 8).toUpperCase() })}
          </p>
        )}

        <div className="mx-auto mt-2 h-px w-12 bg-gold/30" />

        <p className="max-w-sm text-xs leading-relaxed tracking-wide text-muted-foreground">
          {t('processingDescription')}
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{checkoutT('shipping_note')}</p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
          <Link
            href="/account/orders"
            className="btn-lux"
          >
            {t('viewOrders')}
          </Link>
          <Link
            href="/catalog"
            className="btn-ghost"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
