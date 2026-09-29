'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import NextLink from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { User, ShoppingBag, Settings, LogOut, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface UserMenuProps {
  user: { email: string; isAdmin: boolean }
  locale: string
}

export function UserMenu({ user, locale }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = useTranslations('nav')

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  const initial = user.email[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
          {initial}
        </span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 min-w-[180px] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-xl"
          >
            <p className="truncate border-b border-[var(--border)] px-4 py-2 text-[10px] text-[var(--fg-muted)]">
              {user.email}
            </p>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[var(--fg)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
            >
              <ShoppingBag size={13} />
              {t('myOrders')}
            </Link>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[var(--fg)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
            >
              <User size={13} />
              {t('profile')}
            </Link>
            {user.isAdmin && (
              <NextLink
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[var(--fg)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
              >
                <Settings size={13} />
                {t('admin')}
              </NextLink>
            )}
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 border-t border-[var(--border)] px-4 py-2.5 text-[12px] text-[var(--fg)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={13} />
              {t('logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
