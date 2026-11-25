import { getTranslations } from 'next-intl/server'
import { TransitionLink } from '@/components/transitions/ViewTransitions'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { createClient } from '@/lib/supabaseServer'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { SortControls } from '@/components/catalog/SortControls'
import type { ProductCardItem } from '@/components/ProductCard'
import type { Locale, Category } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structuredData'

export const revalidate = 300

const PAGE_SIZE = 24

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// Only these parameters make a distinct, indexable page; search, filters and sorting are variations of it
const INDEXABLE_PARAMS = new Set(['category', 'page'])

function catalogQuery(category: string, page: number) {
  const query = new URLSearchParams()
  if (category) query.set('category', category)
  if (page > 1) query.set('page', String(page))
  return query.size ? `?${query.toString()}` : ''
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}): Promise<Metadata> {
  const { locale } = await params
  const sp = await searchParams
  const seo = await getTranslations({ locale, namespace: 'seo' })

  const categorySlug = typeof sp.category === 'string' ? sp.category : ''
  const pageParam = typeof sp.page === 'string' && /^\d{1,5}$/.test(sp.page) ? Number(sp.page) : 1
  const search = typeof sp.search === 'string' ? sp.search.trim().slice(0, 60) : ''

  let title = seo('catalogTitle')
  let description = seo('catalogDescription')
  if (categorySlug) {
    const supabase = await createClient()
    const { data: category } = await supabase
      .from('categories')
      .select('slug, name_ru, name_en, name_de, description_ru, description_en, description_de')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle()
    if (category) {
      const record = category as unknown as Record<string, string | null | undefined>
      const name = getLocalizedField(record, 'name', locale as Locale)
      title = seo('categoryTitle', { category: name })
      description = getLocalizedField(record, 'description', locale as Locale) || seo('categoryDescription', { category: name })
    }
  }
  if (search) title = seo('searchTitle', { query: search })
  if (pageParam > 1) title = `${title}, ${seo('pageSuffix', { page: pageParam })}`

  const hasVariations = Object.keys(sp).some((key) => !INDEXABLE_PARAMS.has(key))
  return pageMetadata({
    locale,
    path: '/catalog',
    query: catalogQuery(categorySlug, pageParam),
    title,
    description,
    noindex: hasVariations,
    follow: true,
  })
}


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
  const [t, seo] = await Promise.all([
    getTranslations({ locale, namespace: 'catalog' }),
    getTranslations({ locale, namespace: 'seo' }),
  ])

  const materials = toArray(sp.material)
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
  // An unknown category is a 404, not an empty page that search engines would index as thin content
  if (categorySlug && !selectedCategory) notFound()
  const remainingParams = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (key !== 'category' && key !== 'page' && value !== undefined) {
      for (const item of toArray(value)) remainingParams.append(key, item)
    }
  }
  let query = supabase
    .from('products')
    .select('id, slug, name_ru, name_en, name_de, images, year_circa, price_eur', { count: 'exact' })
    .eq('is_available', true)

  if (selectedCategory) query = query.eq('category_id', selectedCategory.id)
  if (Number.isFinite(priceMin) && priceMin > 0) query = query.gte('price_eur', priceMin)
  if (Number.isFinite(priceMax) && priceMax > 0) query = query.lte('price_eur', priceMax)
  if (search) {
    const safeSearch = search.replace(/[^\p{L}\p{N} -]/gu, '')
    if (safeSearch) query = query.or(`name_ru.ilike.%${safeSearch}%,name_en.ilike.%${safeSearch}%,name_de.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`)
  }

  if (materials.length) query = query.in('material', materials)

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

  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const products = (data ?? []) as ProductCardItem[]
  const categoryRecord = selectedCategory as unknown as Record<string, string | null | undefined> | undefined
  const categoryName = categoryRecord ? getLocalizedField(categoryRecord, 'name', locale as Locale) : ''
  const categoryDescription = categoryRecord ? getLocalizedField(categoryRecord, 'description', locale as Locale) : ''
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: seo('breadcrumbHome'), path: '/' },
    { name: t('title'), path: '/catalog' },
    ...(selectedCategory ? [{ name: categoryName, path: '/catalog', query: `?category=${encodeURIComponent(selectedCategory.slug)}` }] : []),
  ])
  const itemList = itemListJsonLd(
    locale,
    products.map((p) => ({ slug: p.slug, name: getLocalizedField(p as unknown as Record<string, string | null | undefined>, 'name', locale as Locale) }))
  )
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
      <JsonLd data={breadcrumbs} />
      {products.length > 0 && <JsonLd data={itemList} />}
      <header data-testid="catalog-header" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.12),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 text-center sm:px-6 md:pb-16 md:pt-24 lg:px-8">
          <svg aria-hidden="true" viewBox="0 0 120 24" className="mx-auto w-28 text-gold/70" fill="none">
            <path d="M0 12h44M76 12h44" stroke="currentColor" strokeWidth=".8" />
            <path d="M60 3l3.2 6.3L70 12l-6.8 2.7L60 21l-3.2-6.3L50 12l6.8-2.7z" fill="currentColor" />
          </svg>
          <p className="eyebrow eyebrow-center mt-6 justify-center">{t('eyebrow')}</p>
          <h1 className="heading-display mx-auto mt-5 max-w-3xl text-5xl text-foreground md:text-7xl">{categoryName || t('title')}</h1>
          <p className="mx-auto mt-6 max-w-xl font-display text-lg italic leading-relaxed text-muted-foreground">{categoryDescription || t('description')}</p>
          <p data-visual="dynamic" className="mt-8 text-[10px] uppercase tracking-[0.32em] text-gold">{t('itemCount', { count: total })}</p>
        </div>

        {categories.length > 0 && (
          <nav aria-label={t('filters.category')} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul className="mask-fade-x flex items-center gap-8 overflow-x-auto border-y border-gold/20 px-10 py-4 md:justify-center [scrollbar-width:none]">
              <li className="shrink-0">
                <TransitionLink
                  href="/catalog"
                  aria-current={!categorySlug ? 'page' : undefined}
                  className={`link-lux text-[11px] uppercase tracking-[0.24em] transition-colors ${!categorySlug ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('allCategories')}
                </TransitionLink>
              </li>
              {categories.map((category) => {
                const active = category.slug === categorySlug
                return (
                  <li key={category.id} className="shrink-0">
                    <TransitionLink
                      href={`/catalog?category=${encodeURIComponent(category.slug)}`}
                      aria-current={active ? 'page' : undefined}
                      className={`link-lux text-[11px] uppercase tracking-[0.24em] transition-colors ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {getLocalizedField(category as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)}
                    </TransitionLink>
                  </li>
                )
              })}
            </ul>
            <div aria-hidden="true" className="mt-[3px] h-px bg-gold/15" />
          </nav>
        )}
      </header>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
          <aside data-testid="catalog-filters" className="w-full shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:w-56 lg:self-start lg:overflow-y-auto lg:pr-2 xl:w-64">
            <FilterSidebar
              selectedMaterials={materials}
              priceMin={priceMin}
              priceMax={priceMax}
              categories={categories}
              categorySlug={categorySlug}
              search={search}
            />
          </aside>

          <div className="flex-1">
            {categorySlug && (
              <div className="mb-6 inline-flex items-center gap-3 border border-gold/30 bg-card px-4 py-2 text-sm text-foreground">
                <span>{t('selectedCategory', { name: categoryName })}</span>
                <TransitionLink href={`/catalog${remainingParams.size ? `?${remainingParams.toString()}` : ''}`} className="inline-block text-gold transition-transform duration-300 hover:rotate-90" aria-label={t('clearCategoryFilter')}>✕</TransitionLink>
              </div>
            )}
            <div className="mb-8 flex items-center justify-end border-b border-gold/10 pb-6">
              <SortControls currentSort={sort} />
            </div>
            <ProductGrid
              products={products}
              locale={locale as Locale}
              total={total}
              offset={(page - 1) * PAGE_SIZE}
            />
            {totalPages > 1 && (
              <nav aria-label={t('pagination')} className="mt-16 flex items-center justify-center gap-6 border-t border-gold/15 pt-10">
                {page > 1 && <TransitionLink href={pageHref(page - 1)} className="btn-ghost !px-6 !py-3">{t('previous')}</TransitionLink>}
                <span className="heading-display text-lg italic text-muted-foreground">{t('pageOf', { page, total: totalPages })}</span>
                {page < totalPages && <TransitionLink href={pageHref(page + 1)} className="btn-ghost !px-6 !py-3">{t('next')}</TransitionLink>}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
