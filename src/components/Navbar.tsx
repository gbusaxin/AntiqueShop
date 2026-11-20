'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useTheme } from 'next-themes'
import { ShoppingBag, Heart, Menu, X, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserMenu } from '@/components/UserMenu'
import { useCollectionStore } from '@/store/collectionStore'
import { useCollectionHydrated } from '@/store/useStoreHydrated'

const LOCALES = ['en', 'ru', 'de'] as const
const EASE = [0.22, 1, 0.36, 1] as const

interface NavbarProps {
  locale: string
  user: { email: string; isAdmin: boolean } | null
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-gold transition-transform duration-700 ease-lux group-hover:rotate-90" fill="currentColor">
        <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
      </svg>
      <span className="font-display text-[1.6rem] font-medium leading-none tracking-wide text-foreground">
        Vintag<span className="italic text-gold">Empire</span>
      </span>
    </span>
  )
}

export function Navbar({ locale, user }: NavbarProps) {
  const t = useTranslations('nav')
  const activeLocale = useLocale()
  const totalItems = useCartStore((s) => s.totalItems)
  const favoritesCount = useCollectionStore((s) => s.favorites.length)
  const collectionHydrated = useCollectionHydrated()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile sheet on navigation and lock page scroll while it is open
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isActive = (href: string) => href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`)

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/catalog', label: t('catalog') },
    { href: '/about', label: t('about') },
    { href: '/contacts', label: t('contacts') },
  ]

  const mobileLinks = [...navLinks, { href: '/favorites', label: t('favorites') }]
  const solid = scrolled || open
  const iconButton = 'relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors duration-300 hover:bg-gold/10 hover:text-gold'

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
        solid ? 'border-gold/15 shadow-[0_8px_30px_-20px_rgb(0_0_0/0.35)] backdrop-blur-xl' : 'border-transparent'
      }`}
      style={{ backgroundColor: solid ? 'color-mix(in srgb, var(--bg) 86%, transparent)' : 'transparent' }}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-[padding] duration-500 ease-lux sm:px-6 lg:px-8 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <Link href="/" className="group" aria-label="VintagEmpire">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative py-1.5 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 hover:text-foreground ${
                  active ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ duration: 0.6, ease: EASE }}
                    className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="mr-2 hidden items-center gap-1 md:flex">
            {LOCALES.map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-gold/25" />}
                <button
                  data-testid={`locale-${l}`}
                  type="button"
                  aria-label={t('switchLanguage', { language: l.toUpperCase() })}
                  aria-pressed={l === activeLocale}
                  onClick={() => router.replace(pathname, { locale: l })}
                  className={`px-1.5 py-1 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    l === activeLocale
                      ? 'font-semibold text-gold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              </span>
            ))}
          </div>

          <button
            data-testid="theme-toggle"
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={iconButton}
            aria-label={t('toggleTheme')}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mounted && resolvedTheme === 'dark' ? 'sun' : 'moon'}
                initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex"
              >
                {mounted && resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <Link
            href="/favorites"
            data-testid="favorites-link"
            aria-label={t('favorites')}
            aria-current={isActive('/favorites') ? 'page' : undefined}
            className={`${iconButton} !hidden sm:!flex`}
          >
            <Heart size={18} aria-hidden="true" />
            <AnimatePresence>
              {collectionHydrated && favoritesCount > 0 && (
                <motion.span
                  key={favoritesCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-semibold text-white"
                >
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <Link
            href="/cart"
            data-testid="cart-link"
            aria-label={t('cart')}
            className={iconButton}
          >
            <ShoppingBag size={19} aria-hidden="true" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-[var(--bg)]"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="ml-1">
              <UserMenu user={user} locale={locale} />
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="btn-ghost ml-2 hidden !px-4 !py-2 !text-[10px] md:inline-flex"
            >
              {t('login')}
            </Link>
          )}

          <button
            type="button"
            className={`${iconButton} md:hidden`}
            onClick={() => setOpen((v) => !v)}
            aria-label={t('toggleMenu')}
            aria-expanded={open}
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
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden border-t border-gold/15 md:hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }}
              className="flex max-h-[calc(100dvh-4.5rem)] min-h-[calc(100dvh-4.5rem)] flex-col gap-2 overflow-y-auto px-6 py-10"
            >
              {mobileLinks.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={`flex items-baseline gap-4 border-b border-gold/10 py-4 ${isActive(href) ? 'text-gold' : 'text-foreground'}`}
                  >
                    <span className="text-[10px] tracking-[0.3em] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span className="heading-display text-4xl">{label}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } }}
                className="mt-8 flex flex-wrap items-center justify-between gap-6"
              >
                {!user && (
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-lux">
                    {t('login')}
                  </Link>
                )}
                <div className="flex items-center gap-4">
                  {LOCALES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-label={t('switchLanguage', { language: l.toUpperCase() })}
                      aria-pressed={l === activeLocale}
                      onClick={() => {
                        router.replace(pathname, { locale: l })
                        setOpen(false)
                      }}
                      className={`text-xs uppercase tracking-[0.2em] ${
                        l === activeLocale ? 'font-semibold text-gold' : 'text-muted-foreground'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
