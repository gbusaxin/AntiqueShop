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
    <aside className="z-40 flex w-full flex-col border-b border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar)] text-[var(--admin-sidebar-fg)] md:fixed md:left-0 md:top-0 md:h-full md:w-56 md:border-b-0 md:border-r">
      <div className="border-b border-[var(--admin-sidebar-border)] px-5 py-4 md:py-7">
        <Link
          href="/en"
          className="font-serif text-lg tracking-wide text-[var(--admin-sidebar-fg)] transition-colors hover:text-[#E5BD80]"
        >
          Belle Époque
        </Link>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-[#D2B38A]">
          Admin Console
        </p>
      </div>

      <nav aria-label="Admin navigation" className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-2 py-2 md:block md:overflow-visible md:py-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 border-l-2 px-3 py-2.5 text-[12px] tracking-wide transition-colors md:mb-1 ${
                active
                  ? 'border-[#D2B38A] bg-white/10 font-semibold text-[var(--admin-sidebar-fg)]'
                  : 'border-transparent text-[var(--admin-sidebar-muted)] hover:bg-white/5 hover:text-[var(--admin-sidebar-fg)]'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--admin-sidebar-border)] px-5 py-2 md:py-5">
        <p className="truncate text-[10px] text-[var(--admin-sidebar-muted)]">{email}</p>
      </div>
    </aside>
  )
}
