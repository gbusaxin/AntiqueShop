'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Package, Trash2, EyeOff, Eye, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductCondition } from '@/types'

const CONDITION_BADGE: Record<ProductCondition, string> = {
  excellent: 'bg-emerald-400/10 text-emerald-400',
  very_good: 'bg-green-400/10 text-green-400',
  good: 'bg-yellow-400/10 text-yellow-400',
  fair: 'bg-orange-400/10 text-orange-400',
}

interface Product {
  id: string
  slug: string
  name_ru: string | null
  name_en: string | null
  name_de: string | null
  price_eur: number
  condition: string | null
  is_available: boolean
  created_at: string
  images: string[] | null
  categories: { name_en: string | null } | null
}

function localesFilled(p: Pick<Product, 'name_ru' | 'name_en' | 'name_de'>) {
  return [p.name_ru, p.name_en, p.name_de].filter(Boolean).length
}

export function ProductsTableClient({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const allSelected = products.length > 0 && selected.size === products.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkAction(action: string, value?: boolean) {
    const ids = Array.from(selected)
    if (!ids.length) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ids, value }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Action failed')
          return
        }
        toast.success(`${data.affected} product(s) updated`)
        setSelected(new Set())
        router.refresh()
      } catch {
        toast.error('Network error')
      }
    })
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2.5">
          <span className="text-[11px] text-[var(--accent)]">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => bulkAction('toggle_availability', true)}
              disabled={isPending}
              className="flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--fg)] disabled:opacity-40"
            >
              <Eye size={11} />
              Show
            </button>
            <button
              onClick={() => bulkAction('toggle_availability', false)}
              disabled={isPending}
              className="flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--fg)] disabled:opacity-40"
            >
              <EyeOff size={11} />
              Hide
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) {
                  bulkAction('delete')
                }
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 border border-red-400/30 px-3 py-1.5 text-[10px] uppercase tracking-wider text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-40"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-[var(--border)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleAll}
                  className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                  aria-label="Select all"
                >
                  {allSelected ? (
                    <CheckSquare size={14} className="text-[var(--accent)]" />
                  ) : someSelected ? (
                    <CheckSquare size={14} className="opacity-50" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </th>
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
            {products.map((product) => {
              const filled = localesFilled(product)
              const name = product.name_en ?? product.name_ru ?? product.name_de ?? '—'
              const image = product.images?.[0]
              const isSelected = selected.has(product.id)

              return (
                <tr
                  key={product.id}
                  className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--accent)]/5 ${
                    isSelected ? 'bg-[var(--accent)]/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleOne(product.id)}
                      className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                      aria-label={`Select ${name}`}
                    >
                      {isSelected ? (
                        <CheckSquare size={14} className="text-[var(--accent)]" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </td>
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
                  <td className="px-4 py-3 text-[var(--fg-muted)]">
                    {product.categories?.name_en ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent)]">€{product.price_eur}</td>
                  <td className="px-4 py-3">
                    {product.condition ? (
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          CONDITION_BADGE[product.condition as ProductCondition]
                        }`}
                      >
                        {product.condition.replace('_', ' ')}
                      </span>
                    ) : (
                      '—'
                    )}
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

        {products.length === 0 && (
          <div className="py-20 text-center">
            <Package size={36} className="mx-auto mb-3 text-[var(--fg-muted)]/30" />
            <p className="text-[var(--fg-muted)]">No products found</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
            >
              Add your first product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
