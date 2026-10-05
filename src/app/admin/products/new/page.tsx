import { createAdminClient } from '@/lib/supabaseServer'
import { ProductForm } from '@/components/admin/ProductForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewProductPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name_ru, name_en, name_de, description_ru, description_en, description_de, image_url, sort_order, created_at')
    .order('sort_order')

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-[11px] text-[var(--admin-accent-text)] transition-colors hover:text-[var(--admin-accent-text)]"
        >
          <ChevronLeft size={14} />
          Back
        </Link>
        <h1 className="font-serif text-2xl text-[var(--fg)] sm:text-3xl">New Product</h1>
      </div>
      <ProductForm categories={categories ?? []} mode="create" />
    </div>
  )
}
