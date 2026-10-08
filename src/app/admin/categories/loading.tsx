import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function CategoriesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading categories">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
        <Link href="/admin" className="hover:text-[var(--admin-accent-text)]">Admin</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span aria-current="page">Categories</span>
      </nav>
      <div className="mb-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--admin-accent-text)]">Catalog organisation</p>
        <h1 className="font-serif text-3xl">Categories</h1>
        <p role="status" className="mt-2 text-xs text-[var(--fg-muted)]">Loading your collections…</p>
      </div>
      <div aria-hidden="true" className="admin-card divide-y divide-[var(--border)]">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-5 p-5 motion-safe:animate-pulse">
            <div className="h-5 w-5 bg-[var(--border)]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-40 max-w-full bg-[var(--border)]" />
              <div className="h-3 w-28 bg-[var(--border)]" />
            </div>
            <div className="hidden h-6 w-16 bg-[var(--border)] sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
