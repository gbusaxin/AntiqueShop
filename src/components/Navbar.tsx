'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useTheme } from '@/components/providers/ThemeProvider'
import { ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LOCALES = ['en', 'ru', 'de'] as const

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const totalItems = useCartStore((s) => s.totalItems)
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gold/20 bg-emerald-dark/96 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-xl tracking-wider text-gold-rich hover:text-gold transition-colors">
          Belle Époque
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { href: '/', label: t('home') },
            { href: '/catalog', label: t('catalog') },
            { href: '/about', label: t('about') },
            { href: '/contacts', label: t('contacts') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs uppercase tracking-[0.18em] text-gold/70 transition-colors hover:text-gold-rich"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-2 md:flex">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => router.push(pathname, { locale: l })}
                className={`text-[11px] uppercase tracking-wider transition-colors ${
                  l === locale ? 'text-gold-rich' : 'text-gold/40 hover:text-gold/70'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gold/70 transition-colors hover:text-gold-rich"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link href="/cart" className="relative text-gold/70 transition-colors hover:text-gold-rich">
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold-rich text-[10px] font-bold text-emerald-dark">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          <button
            className="text-gold/70 hover:text-gold-rich transition-colors md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gold/15 bg-emerald-dark md:hidden"
          >
            <div className="flex flex-col gap-5 px-6 py-6">
              {[
                { href: '/', label: t('home') },
                { href: '/catalog', label: t('catalog') },
                { href: '/about', label: t('about') },
                { href: '/contacts', label: t('contacts') },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-[0.18em] text-gold/80 hover:text-gold-rich transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pt-2">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => { router.push(pathname, { locale: l }); setOpen(false) }}
                    className={`text-[11px] uppercase tracking-wider ${
                      l === locale ? 'text-gold-rich' : 'text-gold/40'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
