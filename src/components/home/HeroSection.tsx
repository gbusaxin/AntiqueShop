'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'

interface HeroSectionProps {
  title: string
  subtitle: string
  ctaLabel: string
}

function OrnamentalDivider() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0 text-gold/60">
        <path
          d="M14 2L16.4 8.8L23.6 8.8L17.6 13.2L20 20L14 15.6L8 20L10.4 13.2L4.4 8.8L11.6 8.8Z"
          fill="currentColor"
        />
        <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  )
}

export function HeroSection({ title, subtitle, ctaLabel }: HeroSectionProps) {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #033728 0%, #053d2c 35%, #3d0f0f 75%, #6B1A1A 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-gold/60">Belle Époque · Est. 1987</p>
        </motion.div>

        <motion.h1
          data-testid="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          className="font-serif text-4xl leading-tight tracking-wide text-gold-rich sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-8 max-w-lg"
        >
          <OrnamentalDivider />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: 'easeOut' }}
          className="mx-auto mt-8 max-w-xl text-sm leading-relaxed tracking-wide text-[#c8bfaa]/80 sm:text-base"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="mt-10"
        >
          <Link
            href="/catalog"
            className="group inline-block border border-gold/60 px-10 py-3.5 text-xs uppercase tracking-[0.25em] text-gold/90 transition-all duration-300 hover:bg-gold/10 hover:border-gold hover:text-gold-rich"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-px bg-gradient-to-b from-gold/50 to-transparent" />
          <div className="h-1.5 w-1.5 rounded-full bg-gold/40" />
        </div>
      </motion.div>
    </section>
  )
}
