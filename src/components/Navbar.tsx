'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useTheme } from 'next-themes'
import { ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserMenu } from '@/components/UserMenu'

const LOCALES = ['en', 'ru', 'de'] as const

interface NavbarProps {
  locale: string
  user: { email: string; isAdmin: boolean } | null
}

export function Navbar({ locale, user }: NavbarProps) {
  const t = useTranslations('nav')
  const totalItems = useCartStore((s) => s.totalItems)
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/catalog', label: t('catalog') },
    { href: '/about', label: t('about') },
    { href: '/contacts', label: t('contacts') },
  ]

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-serif text-xl tracking-wider text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
        >
          Belle Époque
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
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
                data-testid={`locale-${l}`}
                onClick={() => router.push(pathname, { locale: l })}
                className={`text-[11px] uppercase tracking-wider transition-colors ${
                  l === locale
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            data-testid="theme-toggle"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            href="/cart"
            data-testid="cart-link"
            className="relative text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <UserMenu user={user} locale={locale} />
          ) : (
            <Link
              href="/auth/login"
              className="hidden border border-[var(--accent)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white md:block"
            >
              {t('login')}
            </Link>
          )}

          <button
            className="text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors md:hidden"
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
            className="overflow-hidden border-t border-[var(--border)] bg-[var(--bg)] md:hidden"
          >
            <div className="flex flex-col gap-5 px-6 py-6">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  {label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="w-fit border border-[var(--accent)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--accent)]"
                >
                  {t('login')}
                </Link>
              )}
              <div className="flex items-center gap-3 pt-2">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      router.push(pathname, { locale: l })
                      setOpen(false)
                    }}
                    className={`text-[11px] uppercase tracking-wider ${
                      l === locale ? 'text-[var(--accent)]' : 'text-[var(--fg-muted)]'
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
