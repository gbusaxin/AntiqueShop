import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { TransitionLink } from '@/components/transitions/ViewTransitions'
import { MessageCircle } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabaseServer'
import { localizedUrl, NO_INDEX, pageMetadata } from '@/lib/seo'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/structuredData'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice, getPriceForRegion } from '@/lib/getPriceForRegion'
import { getExchangeRates } from '@/lib/exchangeRates'
import { getCookieRegion, getRegionFromCountryCode, REGION_CURRENCIES } from '@/lib/region'
import { PhotoGallery } from '@/components/product/PhotoGallery'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { ViewTracker } from '@/components/product/ViewTracker'
import { ProductViewEvent } from '@/components/analytics/ProductViewEvent'
import { RecentlyViewed } from '@/components/favorites/RecentlyViewed'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ProductCard, type ProductCardItem } from '@/components/ProductCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { JsonLd } from '@/components/JsonLd'
import { cookies, headers } from 'next/headers'
import type { Product, Locale, Region } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

/** Country is stored as an ISO code by the Etsy import; older free-text values are shown as is. */
function countryName(value: string | null, locale: string): string | null {
  if (!value || !/^[A-Z]{2}$/.test(value)) return value
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(value) ?? value
  } catch {
    return value
  }
}

const regionCurrencies = new Map(Object.entries(REGION_CURRENCIES))

type ProductWithCategory = Product & {
  categories: { slug: string; name_ru: string | null; name_en: string | null; name_de: string | null } | null
}

/**
 * A listed piece, or a sold one (its page stays reachable for old links and ads, marked as sold).
 * Pieces hidden by the shop for other reasons are not shown.
 */
const getProduct = cache(async (slug: string): Promise<{ product: ProductWithCategory; sold: boolean } | null> => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, sku, category_id, name_ru, name_en, name_de, description_ru, description_en, description_de, provenance_ru, provenance_en, provenance_de, material, size, country_of_origin, year_circa, price_eur, price_override, images, is_available, categories(slug, name_ru, name_en, name_de)')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  const product = data as unknown as ProductWithCategory
  if (product.is_available) return { product, sold: false }

  const { count } = await supabase
    .from('order_items')
    .select('id, orders!inner(status)', { count: 'exact', head: true })
    .eq('product_id', product.id)
    .in('orders.status', ['paid', 'shipped', 'completed'])
  return count ? { product, sold: true } : null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const [t, seo, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'seo' }),
    getTranslations({ locale, namespace: 'catalog' }),
  ])
  const found = await getProduct(slug)
  if (!found) return { title: t('title'), robots: NO_INDEX }

  const { product, sold } = found
  const record = product as unknown as Record<string, string | null | undefined>
  const name = getLocalizedField(record, 'name', locale as Locale)
  const material = product.material && catalog.has(`materials.${product.material}`) ? catalog(`materials.${product.material}`) : product.material
  const details = [product.year_circa ? t('circa', { year: product.year_circa }) : null, material].filter(Boolean).join(', ')
  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  // Snippet leads with what searchers compare (piece, age, material, price), then the shop's own text
  const summary = seo('productDescription', { name, details: details ? ` — ${details}` : '', price: formatPrice(product.price_eur ?? 0, 'EUR', localeStr) })
  const description = `${summary} ${getLocalizedField(record, 'description', locale as Locale)}`.trim()

  return pageMetadata({
    locale,
    path: `/catalog/${product.slug}`,
    title: sold ? seo('soldTitle', { name }) : name,
    description,
    // Branded share card with photo and price (opengraph-image.tsx); PNG works in every messenger
    images: [{ url: localizedUrl(locale, `/catalog/${product.slug}/opengraph-image`), width: 1200, height: 630, alt: name }],
    // A sold piece stays reachable for visitors but leaves the index
    noindex: sold,
  })
}


export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, nav, currency, catalog, found, seo] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'currency' }),
    getTranslations({ locale, namespace: 'catalog' }),
    getProduct(slug),
    getTranslations({ locale, namespace: 'seo' }),
  ])

  if (!found) notFound()
  const { product, sold } = found
  const productRecord = product as unknown as Record<string, string | null | undefined>
  const name = getLocalizedField(productRecord, 'name', locale as Locale)
  const description = getLocalizedField(productRecord, 'description', locale as Locale)
  const provenance = getLocalizedField(productRecord, 'provenance', locale as Locale)
  const material = catalog.has(`materials.${product.material}`) ? catalog(`materials.${product.material}`) : product.material

  const relatedPromise = createClient().then((supabase) => supabase
    .from('products')
    .select('id, slug, sku, name_ru, name_en, name_de, images, year_circa, price_eur')
    .eq('is_available', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4))

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const cookieRegion = getCookieRegion(cookieStore as Parameters<typeof getCookieRegion>[0])
  const countryCode = headerStore.get('x-vercel-ip-country')
  const region: Region = cookieRegion ?? (countryCode ? getRegionFromCountryCode(countryCode) : 'EU')

  const targetCurrency = regionCurrencies.get(region) ?? 'EUR'
  const exchangeRatesPromise = targetCurrency === 'EUR' || product.price_override?.currency === targetCurrency
    ? Promise.resolve({} as Record<string, number>)
    : getExchangeRates()
  const [{ data: relatedRaw }, exchangeRates] = await Promise.all([relatedPromise, exchangeRatesPromise])
  const related = (relatedRaw ?? []) as ProductCardItem[]
  const priceInfo = await getPriceForRegion(
    product.price_eur ?? 0,
    product.price_override as { amount: number; currency: string } | null,
    region,
    exchangeRates
  )

  const categoryRecord = product.categories as unknown as Record<string, string | null | undefined> | null
  const categoryName = categoryRecord ? getLocalizedField(categoryRecord, 'name', locale as Locale) : ''
  const productLd = productJsonLd({
    locale,
    slug: product.slug,
    name,
    description: description || name,
    images: (product.images ?? []).filter((src) => /^https:\/\//.test(src)),
    sku: product.sku,
    priceEur: product.price_eur ?? 0,
    available: !sold,
    category: categoryName || null,
    material: material || null,
    countryOfOrigin: countryName(product.country_of_origin, 'en'),
    year: product.year_circa,
  })
  const breadcrumbLd = breadcrumbJsonLd(locale, [
    { name: seo('breadcrumbHome'), path: '/' },
    { name: nav('catalog'), path: '/catalog' },
    ...(product.categories ? [{ name: categoryName, path: '/catalog', query: `?category=${encodeURIComponent(product.categories.slug)}` }] : []),
    { name },
  ])

  const cardItem: ProductCardItem = {
    id: product.id,
    slug: product.slug,
    name_ru: product.name_ru,
    name_en: product.name_en,
    name_de: product.name_de,
    images: product.images ?? [],
    year_circa: product.year_circa,
    price_eur: product.price_eur,
  }

  const specs = [
    { label: t('material'), value: product.material ? material : null },
    { label: t('size'), value: product.size },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec.value))

  const country = countryName(product.country_of_origin, locale)
  const subtitle = [product.year_circa ? t('circa', { year: product.year_circa }) : null, country].filter(Boolean).join(' · ')
  const [leadParagraph, ...restParagraphs] = (description ?? '').split('\n').map((para) => para.trim()).filter(Boolean)

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <ViewTracker slug={slug} />
      {!sold && (
        <ProductViewEvent item={{ id: product.sku || product.id, name, price: product.price_eur ?? 0, category: categoryName || null }} />
      )}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <nav aria-label={t('breadcrumbs')} className="mb-10 flex min-w-0 items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <TransitionLink href="/" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('home')}</TransitionLink>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
          <TransitionLink href="/catalog" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('catalog')}</TransitionLink>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
          {product.categories && (
            <>
              <TransitionLink href={`/catalog?category=${encodeURIComponent(product.categories.slug)}`} className="link-lux hidden shrink-0 transition-colors hover:text-foreground sm:inline">{categoryName}</TransitionLink>
              <span aria-hidden="true" className="hidden h-px w-4 shrink-0 bg-gold/40 sm:inline-block" />
            </>
          )}
          <span className="truncate text-gold">{name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* No entrance animation here: the photo arrives through the shared-element page transition */}
          <div className="lg:sticky lg:top-28 lg:col-span-7 lg:self-start">
            <PhotoGallery images={product.images ?? []} alt={name} productId={product.id} />
          </div>

          {/* Catalogue entry */}
          <article className="flex flex-col lg:col-span-5">
            <header className="animate-page-in [animation-delay:200ms]">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-lg italic text-gold">{t('lotNumber', { sku: product.sku })}</p>
                <FavoriteButton item={cardItem} className="h-11 w-11 shrink-0 border border-gold/25" />
              </div>
              <h1 className="heading-display mt-4 text-4xl text-foreground md:text-[3.4rem]">{name}</h1>
              {subtitle && <p className="mt-4 font-display text-xl italic text-muted-foreground">{subtitle}</p>}
            </header>

            {/* Double rule, as in a printed auction catalogue */}
            <div aria-hidden="true" className="my-8 animate-page-in space-y-[3px] [animation-delay:280ms]">
              <div className="h-px bg-gold/40" />
              <div className="h-px bg-gold/20" />
            </div>

            <div className="animate-page-in [animation-delay:340ms]">
              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{sold ? t('soldLabel') : t('priceLabel')}</p>
              <p className={`heading-display mt-2 text-5xl ${sold ? 'text-muted-foreground line-through decoration-1' : 'text-gold-rich'}`}>
                {formatPrice(priceInfo.amount, priceInfo.currency, localeStr)}
              </p>
              {priceInfo.isConverted && priceInfo.originalEur && (
                <p className="mt-2 text-[11px] tracking-wide text-muted-foreground">
                  {formatPrice(priceInfo.originalEur, 'EUR', localeStr)} · {currency('converted')}
                </p>
              )}
            </div>

            <div className="mt-8 animate-page-in [animation-delay:400ms]">
              {sold ? (
                <>
                  <p className="border border-gold/25 bg-gold/[0.04] p-4 text-sm leading-relaxed text-muted-foreground">{t('soldNotice')}</p>
                  <TransitionLink
                    href={product.categories ? `/catalog?category=${encodeURIComponent(product.categories.slug)}` : '/catalog'}
                    className="btn-lux mt-3 w-full"
                  >
                    {t('soldBrowse')}
                  </TransitionLink>
                </>
              ) : (
                <AddToCartButton
                  product={product}
                  label={t('addToCart')}
                  inCartLabel={t('inCart')}
                />
              )}
              <TransitionLink
                href={`/contacts?item=${encodeURIComponent(product.sku)}#contact-form`}
                className="btn-ghost group mt-3 w-full"
              >
                <MessageCircle size={14} aria-hidden="true" className="text-gold transition-transform duration-500 ease-lux group-hover:-rotate-12" />
                {t('askAboutItem')}
              </TransitionLink>
            </div>

            {leadParagraph && (
              <section className="reveal mt-14">
                <h2 className="eyebrow mb-5">{t('descriptionTitle')}</h2>
                <div className="space-y-4 text-[15px] leading-[1.85] text-muted-foreground">
                  <p className="flow-root first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.8] first-letter:text-gold-rich">{leadParagraph}</p>
                  {restParagraphs.map((para, i) => <p key={i}>{para}</p>)}
                </div>
              </section>
            )}

            {specs.length > 0 && (
              <section className="mt-12">
                <h2 className="eyebrow mb-3">{t('detailsTitle')}</h2>
                <dl className="flex flex-col">
                  {specs.map((spec) => (
                    <div key={spec.label} className="reveal flex items-baseline gap-3 border-b border-gold/10 py-3 text-sm">
                      <dt className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{spec.label}</dt>
                      <span aria-hidden="true" className="reveal-line mb-1 flex-1 border-b border-dotted border-gold/30" />
                      <dd className="text-right text-foreground">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {provenance && (
              <figure className="reveal relative mt-12 bg-deep/70 px-6 py-6">
                <span aria-hidden="true" className="heading-display absolute -top-5 left-4 text-6xl leading-none text-gold/40">“</span>
                <figcaption className="eyebrow mb-3">{t('provenance')}</figcaption>
                <blockquote className="font-display text-lg italic leading-relaxed text-foreground/90">{provenance}</blockquote>
              </figure>
            )}
          </article>
        </div>

        {related.length > 0 && (
          <AnimatedSection className="mt-28 border-t border-gold/15 pt-20">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 className="heading-display text-4xl text-foreground md:text-5xl">{t('similarItems')}</h2>
              <TransitionLink href="/catalog" className="link-lux hidden text-[11px] uppercase tracking-[0.22em] text-gold sm:inline">{nav('catalog')}</TransitionLink>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale as Locale} />
              ))}
            </div>
          </AnimatedSection>
        )}

        <RecentlyViewed current={cardItem} locale={locale as Locale} />
      </div>
    </div>
  )
}
