import { createAdminClient } from '@/lib/supabaseServer'
import { ProductForm } from '@/components/admin/ProductForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single(),
    supabase.from('categories').select('id, slug, name_ru, name_en, name_de, description_ru, description_en, description_de, image_url, sort_order, is_active, created_at, updated_at').order('sort_order'),
  ])

  if (!product) notFound()

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
        <h1 className="font-serif text-2xl text-[var(--fg)] sm:text-3xl">
          Edit: {product.name_en ?? product.name_ru ?? product.slug}
        </h1>
      </div>
      <ProductForm
        categories={categories ?? []}
        mode="edit"
        initialData={{ ...product, id: product.id }}
      />
    </div>
  )
}
