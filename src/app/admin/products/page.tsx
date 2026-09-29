import { createAdminClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Package } from 'lucide-react'
import type { ProductCondition } from '@/types'

const CONDITION_BADGE: Record<ProductCondition, string> = {
  excellent: 'bg-emerald-400/10 text-emerald-400',
  very_good: 'bg-green-400/10 text-green-400',
  good: 'bg-yellow-400/10 text-yellow-400',
  fair: 'bg-orange-400/10 text-orange-400',
}

function localesFilled(p: { name_ru: string | null; name_en: string | null; name_de: string | null }) {
  return [p.name_ru, p.name_en, p.name_de].filter(Boolean).length
}

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; available?: string }>
}) {
  const { q, available } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select('id, slug, name_ru, name_en, name_de, price_eur, condition, is_available, created_at, images, categories(name_en)')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`name_en.ilike.%${q}%,name_ru.ilike.%${q}%`)
  }
  if (available === 'true') query = query.eq('is_available', true)
  if (available === 'false') query = query.eq('is_available', false)

  const { data: products } = await query

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-[var(--fg)]">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
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
            placeholder="Search products…"
            className="border border-[var(--border)] bg-transparent px-3 py-1.5 text-[12px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            type="submit"
            className="border border-[var(--border)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                  ? 'border border-[var(--accent)] text-[var(--accent)]'
                  : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-[var(--fg-muted)]">
          {(products ?? []).length} items
        </span>
      </div>

      <div className="overflow-x-auto border border-[var(--border)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Condition</th>
              <th className="px-4 py-3 text-left">Locales</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => {
              const cat = product.categories as unknown as { name_en: string | null } | null
              const filled = localesFilled(product)
              const name = product.name_en ?? product.name_ru ?? product.name_de ?? '—'
              const image = product.images?.[0]

              return (
                <tr
                  key={product.id}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--accent)]/5"
                >
                  <td className="px-4 py-3">
                    {image ? (
                      <Image
                        src={image}
                        alt={name}
                        width={44}
                        height={44}
                        className="h-11 w-11 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center bg-[var(--border)]">
                        <Package size={14} className="text-[var(--fg-muted)]" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg)]">{name}</td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">{cat?.name_en ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--accent)]">€{product.price_eur}</td>
                  <td className="px-4 py-3">
                    {product.condition ? (
                      <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${CONDITION_BADGE[product.condition as ProductCondition]}`}>
                        {product.condition.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium ${
                        filled === 3
                          ? 'text-emerald-400'
                          : filled >= 1
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                      title={`${filled} of 3 locales filled`}
                    >
                      {filled}/3
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        product.is_available ? 'text-emerald-400' : 'text-[var(--fg-muted)]'
                      }`}
                    >
                      {product.is_available ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center gap-1.5 text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(products ?? []).length === 0 && (
          <div className="py-20 text-center">
            <Package size={36} className="mx-auto mb-3 text-[var(--fg-muted)]/30" />
            <p className="text-[var(--fg-muted)]">No products found</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
            >
              <Plus size={13} />
              Add your first product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
