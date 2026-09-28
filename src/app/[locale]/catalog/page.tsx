import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabaseServer'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { SortControls } from '@/components/catalog/SortControls'
import type { Product, Locale } from '@/types'
import type { Metadata } from 'next'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Antique Catalog — Belle Époque',
    description: 'Browse our curated collection of rare antique objects from across Europe.',
  }
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('catalog')

  const eras = toArray(sp.era)
  const materials = toArray(sp.material)
  const condition = typeof sp.condition === 'string' ? sp.condition : ''
  const priceMin = Number(sp.priceMin ?? 0)
  const priceMax = Number(sp.priceMax ?? 50000)
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest'

  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_available', true)
    .gte('price_eur', priceMin)
    .lte('price_eur', priceMax)

  if (eras.length) query = query.in('era', eras)
  if (materials.length) query = query.in('material', materials)
  if (condition) query = query.eq('condition', condition)

  switch (sort) {
    case 'price_asc':
      query = query.order('price_eur', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_eur', { ascending: false })
      break
    case 'era':
      query = query.order('era', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query.limit(60)
  const products = (data ?? []) as Product[]

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Our Collection</p>
          <h1 className="mt-2 font-serif text-3xl text-gold-rich md:text-4xl">{t('title')}</h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <aside className="w-full shrink-0 lg:w-56 xl:w-64">
            <FilterSidebar
              selectedEras={eras}
              selectedMaterials={materials}
              priceMin={priceMin}
              priceMax={priceMax}
              condition={condition}
            />
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-end">
              <SortControls currentSort={sort} />
            </div>
            <ProductGrid
              products={products}
              locale={locale as Locale}
              total={count ?? products.length}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
