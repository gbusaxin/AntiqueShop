'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  MessageSquare,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, exact: false },
  { href: '/admin/content', label: 'Content', icon: FileText, exact: false },
  { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare, exact: false },
]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 flex h-full w-56 flex-col border-r border-[var(--border)] bg-[var(--bg)]">
      <div className="border-b border-[var(--border)] px-5 py-6">
        <Link
          href="/en"
          className="font-serif text-base tracking-wider text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
        >
          Belle Époque
        </Link>
        <p className="mt-0.5 text-[9px] uppercase tracking-widest text-[var(--fg-muted)]">
          Admin Console
        </p>
      </div>

      <nav className="flex-1 px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`mb-0.5 flex items-center gap-3 rounded px-3 py-2.5 text-[12px] tracking-wide transition-colors ${
                active
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--accent)]/5 hover:text-[var(--fg)]'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--border)] px-5 py-4">
        <p className="truncate text-[10px] text-[var(--fg-muted)]">{email}</p>
      </div>
    </aside>
  )
}
