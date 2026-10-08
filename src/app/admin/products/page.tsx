import { createAdminClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProductsTableClient } from '@/components/admin/ProductsTableClient'

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; available?: string }>
}) {
  const { q, available } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select('id, slug, sku, name_ru, name_en, name_de, material, size, price_eur, condition, is_available, created_at, images, categories(name_en)')
    .order('created_at', { ascending: false })

  const safeQuery = q?.trim().replace(/[^\p{L}\p{N}\s-]/gu, '').slice(0, 80)
  if (safeQuery) {
    query = query.or(`name_en.ilike.%${safeQuery}%,name_ru.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%`)
  }
  if (available === 'true') query = query.eq('is_available', true)
  if (available === 'false') query = query.eq('is_available', false)

  const { data: products } = await query

  const rows = (products ?? []).map((p) => ({
    ...p,
    categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories as { name_en: string | null } | null),
  }))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-[var(--fg)]">Products</h1>
        <Link
          href="/admin/products/new"
          className="admin-primary flex items-center gap-2"
        >
          <Plus size={13} />
          Add Product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or SKU…"
            className="admin-input min-w-0 sm:w-64"
          />
          <button
            type="submit"
            className="admin-secondary"
          >
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          {[
            { label: 'All', value: '' },
            { label: 'Active', value: 'true' },
            { label: 'Hidden', value: 'false' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={value ? `/admin/products?available=${value}` : '/admin/products'}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                (available ?? '') === value
                  ? 'border border-[var(--accent)] text-[var(--admin-accent-text)]'
                  : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-[var(--fg-muted)]">
          {rows.length} items
        </span>
      </div>

      <ProductsTableClient products={rows} />
    </div>
  )
}
