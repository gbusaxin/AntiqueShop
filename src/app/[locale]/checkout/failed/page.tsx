'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { XCircle } from 'lucide-react'

export default function CheckoutFailedPage() {
  const t = useTranslations('checkout.failed')
  const contactsT = useTranslations('contacts')
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const cancelled = searchParams.get('reason') === 'cancelled'

  // Back from the payment page: close the unpaid payment so the piece is free for a new attempt
  useEffect(() => {
    if (!orderId) return
    fetch('/api/checkout/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
      keepalive: true,
    }).catch(() => {})
  }, [orderId])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24">
      <title>{`${cancelled ? t('cancelledTitle') : t('title')} — VintagEmpire`}</title>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <XCircle size={64} className="text-red-400" strokeWidth={1.5} />
        </motion.div>

        <h1 className="heading-display mb-4 text-5xl text-[var(--fg)]">
          {cancelled ? t('cancelledTitle') : t('title')}
        </h1>
        <p className="mb-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          {cancelled ? t('cancelledDescription') : t('description')}
        </p>
        {!cancelled && (
          <p className="mb-8 text-sm leading-relaxed text-[var(--fg-muted)]">
            {t('instructions')}
          </p>
        )}
        {cancelled && <div className="mb-8" />}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/checkout"
            className="btn-lux"
          >
            {t('tryAgain')}
          </Link>
          <Link
            href="/cart"
            className="btn-ghost"
          >
            {t('backToCart')}
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[var(--fg-muted)]">
          {t('needHelp')}{' '}
          <Link
            href="/contacts"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            {contactsT('title')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
