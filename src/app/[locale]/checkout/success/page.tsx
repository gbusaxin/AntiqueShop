'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useSearchParams } from 'next/navigation'

type PaymentState = 'checking' | 'paid' | 'awaiting' | 'pending'

// The provider redirects the buyer here before (or without) its webhook: ask the server a few times
const POLL_INTERVAL_MS = 2000
const POLL_ATTEMPTS = 8

export default function CheckoutSuccessPage() {
  const t = useTranslations('checkout.success')
  const checkoutT = useTranslations('checkout')
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const clearCart = useCartStore((s) => s.clearCart)
  const [state, setState] = useState<PaymentState>(orderId ? 'checking' : 'paid')

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const check = async (attempt: number) => {
      let status: string | null = null
      try {
        const res = await fetch(`/api/checkout/status?orderId=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
        if (res.ok) status = ((await res.json()) as { status?: string }).status ?? null
      } catch {
        status = null
      }
      if (cancelled) return

      if (status === 'paid' || status === 'shipped' || status === 'completed') {
        clearCart()
        setState('paid')
      } else if (status === 'awaiting_payment') {
        clearCart()
        setState('awaiting')
      } else if (status === 'cancelled') {
        router.replace(`/checkout/failed?orderId=${orderId}&reason=cancelled`)
      } else if (attempt + 1 < POLL_ATTEMPTS) {
        timer = setTimeout(() => check(attempt + 1), POLL_INTERVAL_MS)
      } else {
        // Still settling (e.g. SBP confirmation from the bank) — or left unpaid; the cart stays until we know
        setState('pending')
      }
    }

    check(0)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [orderId, clearCart, router])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center text-foreground">
        <title>{`${t('checking')} — VintagEmpire`}</title>
        <div className="h-14 w-14 animate-spin rounded-full border border-gold/20 border-t-gold-rich" aria-hidden="true" />
        <p className="eyebrow" role="status">{t('checking')}</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{t('checkingDescription')}</p>
      </div>
    )
  }

  const settled = state === 'paid'
  const eyebrow = settled ? t('title') : t('awaitingTitle')
  const heading = settled ? t('heading') : t('awaitingHeading')
  const description =
    state === 'paid' ? t('processingDescription') : state === 'awaiting' ? t('awaitingDescription') : t('pendingDescription')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <title>{`${eyebrow} — VintagEmpire`}</title>
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
          {settled ? (
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
          ) : (
            <motion.path
              d="M18 6a12 12 0 1 0 0 24a12 12 0 1 0 0-24M18 11v7l5 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          )}
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="heading-display text-5xl text-foreground md:text-6xl">{heading}</h1>

        {orderId && (
          <p className="text-xs tracking-wide text-muted-foreground">
            {t('orderReference', { orderId: orderId.slice(0, 8).toUpperCase() })}
          </p>
        )}

        <div className="mx-auto mt-2 h-px w-12 bg-gold/30" />

        <p className="max-w-sm text-xs leading-relaxed tracking-wide text-muted-foreground">{description}</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{checkoutT('shipping_note')}</p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
          <Link href="/account/orders" className="btn-lux">
            {t('viewOrders')}
          </Link>
          <Link href="/catalog" className="btn-ghost">
            {t('continueShopping')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
