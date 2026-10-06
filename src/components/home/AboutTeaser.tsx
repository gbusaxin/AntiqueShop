'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function AboutTeaser() {
  const t = useTranslations('home')

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="flex flex-col gap-6"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold/60">{t('heritageEyebrow')}</p>
            <h2 className="font-serif text-3xl leading-snug text-gold-rich md:text-4xl">
              {t('heritageTitle')}
            </h2>
            <div className="h-px w-12 bg-gold/40" />
            <p className="text-sm leading-relaxed tracking-wide text-[#c8bfaa]/75">
              {t('heritageFirst')}
            </p>
            <p className="text-sm leading-relaxed tracking-wide text-[#c8bfaa]/75">
              {t('heritageSecond')}
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="border-b border-gold/40 pb-0.5 text-xs uppercase tracking-[0.2em] text-gold/80 transition-colors hover:border-gold hover:text-gold-rich"
              >
                {t('heritageLink')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, delay: 0.15, ease: 'easeOut' }}
            className="relative"
          >
            <div
              className="aspect-[4/5] bg-gradient-to-br from-[#1a4a3a] to-[#3d1a1a]"
              style={{
                boxShadow: '16px 16px 0 0 rgba(184,134,11,0.08)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-gold/10">
                  <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="1" />
                  <path d="M40 10L43.5 28H62L47.5 38.5L53 57L40 46.5L27 57L32.5 38.5L18 28H36.5Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 border border-gold/20 bg-emerald-dark px-6 py-4">
              <p className="font-serif text-2xl text-gold-rich">35+</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gold/60">{t('heritageYears')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
