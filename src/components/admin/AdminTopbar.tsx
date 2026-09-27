'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const BREADCRUMBS: Record<string, string[]> = {
  '/admin': ['Dashboard'],
  '/admin/products': ['Products'],
  '/admin/orders': ['Orders'],
  '/admin/content': ['Content'],
  '/admin/contacts': ['Contacts'],
}

function getBreadcrumb(pathname: string): string[] {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname]
  const base = Object.keys(BREADCRUMBS).find(
    (k) => k !== '/admin' && pathname.startsWith(k)
  )
  if (base) {
    const rest = pathname.slice(base.length).replace(/^\//, '')
    return [...BREADCRUMBS[base]!, rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : ''].filter(Boolean)
  }
  return ['Admin']
}

export function AdminTopbar({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname()
  const crumbs = getBreadcrumb(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="text-[var(--fg-muted)]">Admin</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-[var(--fg-muted)]">/</span>
            <span className={i === crumbs.length - 1 ? 'text-[var(--fg)] font-medium' : 'text-[var(--fg-muted)]'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/contacts"
          className="relative text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          title="Contact requests"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
