import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { createClient } from '@/lib/supabaseServer'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { SortControls } from '@/components/catalog/SortControls'
import type { ProductCardItem } from '@/components/ProductCard'
import type { Locale, Category } from '@/types'
import type { Metadata } from 'next'

export const revalidate = 300

const PAGE_SIZE = 24

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'catalog' })
  return {
    title: `${t('title')} — VintagEmpire`,
    description: t('description'),
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
  const t = await getTranslations({ locale, namespace: 'catalog' })

  const materials = toArray(sp.material)
  const condition = typeof sp.condition === 'string' ? sp.condition : ''
  const priceMin = Number(sp.price_min ?? sp.priceMin ?? 0)
  const priceMax = Number(sp.price_max ?? sp.priceMax ?? 0)
  const categorySlug = typeof sp.category === 'string' ? sp.category : ''
  const search = typeof sp.search === 'string' ? sp.search.trim().slice(0, 100) : ''
  const sort = sp.sort === 'price_asc' || sp.sort === 'price_desc' ? sp.sort : 'newest'
  const pageParam = typeof sp.page === 'string' ? sp.page : ''
  const page = /^\d{1,5}$/.test(pageParam) ? Math.max(1, Number(pageParam)) : 1

  const supabase = await createClient()
  const { data: categoryRows } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
  const categories = (categoryRows ?? []) as Category[]
  const selectedCategory = categories.find((category) => category.slug === categorySlug)
  const categoryNotFound = Boolean(categorySlug && !selectedCategory)
  const remainingParams = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (key !== 'category' && key !== 'page' && value !== undefined) {
      for (const item of toArray(value)) remainingParams.append(key, item)
    }
  }
  let query = supabase
    .from('products')
    .select('id, slug, name_ru, name_en, name_de, images, condition, year_circa, price_eur', { count: 'exact' })
    .eq('is_available', true)

  if (selectedCategory) query = query.eq('category_id', selectedCategory.id)
  if (Number.isFinite(priceMin) && priceMin > 0) query = query.gte('price_eur', priceMin)
  if (Number.isFinite(priceMax) && priceMax > 0) query = query.lte('price_eur', priceMax)
  if (search) {
    const safeSearch = search.replace(/[^\p{L}\p{N} -]/gu, '')
    if (safeSearch) query = query.or(`name_ru.ilike.%${safeSearch}%,name_en.ilike.%${safeSearch}%,name_de.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`)
  }

  if (materials.length) query = query.in('material', materials)
  if (condition) query = query.eq('condition', condition)

  switch (sort) {
    case 'price_asc':
      query = query.order('price_eur', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_eur', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, count } = categoryNotFound
    ? { data: [], count: 0 }
    : await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const products = (data ?? []) as ProductCardItem[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginationParams = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (key !== 'page' && value !== undefined) {
      for (const item of toArray(value)) paginationParams.append(key, item)
    }
  }
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams(paginationParams)
    if (nextPage > 1) params.set('page', String(nextPage))
    return `/catalog${params.size ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <header data-testid="catalog-header" className="relative overflow-hidden border-b border-gold/15">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.14),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 md:pb-20 md:pt-24 lg:px-8">
          <p className="eyebrow animate-page-in">{t('eyebrow')}</p>
          <h1 className="heading-display mt-6 max-w-4xl animate-page-in text-5xl text-foreground [animation-delay:120ms] md:text-7xl">{t('title')}</h1>
          <p className="mt-6 max-w-xl animate-page-in text-[15px] leading-relaxed text-muted-foreground [animation-delay:240ms]">{t('description')}</p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
          <aside data-testid="catalog-filters" className="w-full shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:w-56 lg:self-start lg:overflow-y-auto lg:pr-2 xl:w-64">
            <FilterSidebar
              selectedMaterials={materials}
              priceMin={priceMin}
              priceMax={priceMax}
              condition={condition}
              categories={categories}
              categorySlug={categorySlug}
              search={search}
            />
          </aside>

          <div className="flex-1">
            {categorySlug && (
              <div className="mb-6 inline-flex items-center gap-3 border border-gold/30 bg-card px-4 py-2 text-sm text-foreground">
                <span>{categoryNotFound ? t('categoryNotFound') : t('selectedCategory', { name: getLocalizedField(selectedCategory as unknown as Record<string, string | null | undefined>, 'name', locale as Locale) })}</span>
                <Link href={`/catalog${remainingParams.size ? `?${remainingParams.toString()}` : ''}`} className="inline-block text-gold transition-transform duration-300 hover:rotate-90" aria-label={t('clearCategoryFilter')}>✕</Link>
              </div>
            )}
            <div className="mb-8 flex items-center justify-end border-b border-gold/10 pb-6">
              <SortControls currentSort={sort} />
            </div>
            <ProductGrid
              products={products}
              locale={locale as Locale}
              total={total}
            />
            {totalPages > 1 && (
              <nav aria-label={t('pagination')} className="mt-16 flex items-center justify-center gap-6 border-t border-gold/15 pt-10">
                {page > 1 && <Link href={pageHref(page - 1)} className="btn-ghost !px-6 !py-3">{t('previous')}</Link>}
                <span className="heading-display text-lg italic text-muted-foreground">{t('pageOf', { page, total: totalPages })}</span>
                {page < totalPages && <Link href={pageHref(page + 1)} className="btn-ghost !px-6 !py-3">{t('next')}</Link>}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
