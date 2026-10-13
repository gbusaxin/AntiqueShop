'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')

  useEffect(() => {
    console.error('[LocaleError]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center"
      >
        <p className="mb-4 font-serif text-7xl text-[var(--accent)]">500</p>
        <h1 className="mb-4 font-serif text-2xl text-[var(--fg)]">{t('general')}</h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          {t('unexpectedDescription')}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="border border-[var(--accent)] px-8 py-3 text-xs uppercase tracking-[0.18em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {tCommon('tryAgain')}
          </button>
          <Link
            href="/"
            className="px-8 py-3 text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {tCommon('backToHome')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
