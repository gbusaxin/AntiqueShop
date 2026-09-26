import { createAdminClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import type { ProductCondition } from '@/types'

function localesFilled(p: { name_ru: string | null; name_en: string | null; name_de: string | null }) {
  return [p.name_ru, p.name_en, p.name_de].filter(Boolean).length
}

const CONDITION_COLORS: Record<ProductCondition, string> = {
  excellent: 'text-emerald-400',
  very_good: 'text-green-400',
  good: 'text-yellow-400',
  fair: 'text-orange-400',
}

export default async function AdminProducts() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name_ru, name_en, name_de, price_eur, condition, is_available, created_at, images, categories(name_en)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[#c9a84c]">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 border border-[#c9a84c] px-4 py-2 text-[11px] uppercase tracking-wider text-[#c9a84c] transition-colors hover:bg-[#c9a84c] hover:text-[#0d1f1a]"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#c9a84c]/20 text-[10px] uppercase tracking-widest text-[#c9a84c]/60">
              <th className="pb-3 pr-4 text-left">Image</th>
              <th className="pb-3 pr-4 text-left">Name</th>
              <th className="pb-3 pr-4 text-left">Category</th>
              <th className="pb-3 pr-4 text-left">Price EUR</th>
              <th className="pb-3 pr-4 text-left">Condition</th>
              <th className="pb-3 pr-4 text-left">Locales</th>
              <th className="pb-3 pr-4 text-left">Status</th>
              <th className="pb-3 text-left">Actions</th>
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
                  className="border-b border-[#c9a84c]/10 transition-colors hover:bg-[#c9a84c]/5"
                >
                  <td className="py-3 pr-4">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-[#c9a84c]/10" />
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#f4ead1]/80">{name}</td>
                  <td className="py-3 pr-4 text-[#f4ead1]/50">{cat?.name_en ?? '—'}</td>
                  <td className="py-3 pr-4 text-[#c9a84c]">€{product.price_eur}</td>
                  <td className="py-3 pr-4">
                    {product.condition ? (
                      <span className={CONDITION_COLORS[product.condition as ProductCondition]}>
                        {product.condition.replace('_', ' ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-[10px] ${filled === 3 ? 'text-emerald-400' : filled >= 1 ? 'text-yellow-400' : 'text-red-400'}`}
                    >
                      {filled}/3
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-[10px] uppercase tracking-wider ${product.is_available ? 'text-emerald-400' : 'text-[#f4ead1]/30'}`}
                    >
                      {product.is_available ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center gap-1 text-[#c9a84c]/60 transition-colors hover:text-[#c9a84c]"
                    >
                      <Pencil size={13} />
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(products ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-[#f4ead1]/30">No products yet</p>
        )}
      </div>
    </div>
  )
}
