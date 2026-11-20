import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabaseServer'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice, getPriceForRegion } from '@/lib/getPriceForRegion'
import { getExchangeRates } from '@/lib/exchangeRates'
import { getCookieRegion, getRegionFromCountryCode, REGION_CURRENCIES } from '@/lib/region'
import { PhotoGallery } from '@/components/product/PhotoGallery'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { ViewTracker } from '@/components/product/ViewTracker'
import { RecentlyViewed } from '@/components/favorites/RecentlyViewed'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ProductCard, type ProductCardItem } from '@/components/ProductCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { JsonLd } from '@/components/JsonLd'
import { cookies, headers } from 'next/headers'
import type { Product, Locale, ProductCondition, Region } from '@/types'
import type { Metadata } from 'next'

const CONDITION_DOT: Record<ProductCondition, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-amber-500',
  fair: 'bg-orange-500',
  poor: 'bg-rose-500',
}

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'
const regionCurrencies = new Map(Object.entries(REGION_CURRENCIES))

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, sku, category_id, name_ru, name_en, name_de, description_ru, description_en, description_de, provenance_ru, provenance_en, provenance_de, material, size, country_of_origin, condition, year_circa, price_eur, price_override, images, is_available')
    .eq('slug', slug)
    .eq('is_available', true)
    .maybeSingle()
  return data as Product | null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'product' })
  try {
    const data = await getProduct(slug)

    if (!data) return { title: `${t('title')} — VintagEmpire` }

    const name = getLocalizedField(data as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)
    const description = getLocalizedField(data as unknown as Record<string, string | null | undefined>, 'description', locale as Locale).slice(0, 160)
    const ogImage = Array.isArray(data.images) && data.images[0] ? data.images[0] : undefined

    return {
      title: `${name} — VintagEmpire`,
      description,
      alternates: {
        canonical: `${BASE_URL}/${locale}/catalog/${slug}`,
        languages: {
          en: `${BASE_URL}/en/catalog/${slug}`,
          ru: `${BASE_URL}/ru/catalog/${slug}`,
          de: `${BASE_URL}/de/catalog/${slug}`,
          'x-default': `${BASE_URL}/en/catalog/${slug}`,
        },
      },
      openGraph: {
        type: 'website',
        url: `${BASE_URL}/${locale}/catalog/${slug}`,
        title: `${name} — VintagEmpire`,
        description,
        siteName: 'VintagEmpire',
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 800, alt: name }] } : {}),
      },
    }
  } catch {
    return { title: `${t('title')} — VintagEmpire` }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [t, nav, currency, catalog, product] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'currency' }),
    getTranslations({ locale, namespace: 'catalog' }),
    getProduct(slug),
  ])

  if (!product) notFound()
  const productRecord = product as unknown as Record<string, string | null | undefined>
  const name = getLocalizedField(productRecord, 'name', locale as Locale)
  const description = getLocalizedField(productRecord, 'description', locale as Locale)
  const provenance = getLocalizedField(productRecord, 'provenance', locale as Locale)
  const material = catalog.has(`materials.${product.material}`) ? catalog(`materials.${product.material}`) : product.material

  const relatedPromise = createClient().then((supabase) => supabase
    .from('products')
    .select('id, slug, sku, name_ru, name_en, name_de, images, condition, year_circa, price_eur')
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description ?? '',
    image: product.images ?? [],
    sku: product.sku,
    material: product.material,
    offers: {
      '@type': 'Offer',
      priceCurrency: priceInfo.currency,
      price: priceInfo.amount,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/${locale}/catalog/${slug}`,
    },
    brand: {
      '@type': 'Organization',
      name: 'VintagEmpire',
    },
  }

  const cardItem: ProductCardItem = {
    id: product.id,
    slug: product.slug,
    name_ru: product.name_ru,
    name_en: product.name_en,
    name_de: product.name_de,
    images: product.images ?? [],
    condition: product.condition,
    year_circa: product.year_circa,
    price_eur: product.price_eur,
  }

  const specs = [
    { label: t('material'), value: product.material ? material : null },
    { label: t('size'), value: product.size },
    { label: t('country'), value: product.country_of_origin },
    { label: t('year'), value: product.year_circa ? t('circa', { year: product.year_circa }) : null },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec.value))

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <JsonLd data={jsonLd} />
      <ViewTracker slug={slug} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <nav aria-label={t('breadcrumbs')} className="mb-10 flex min-w-0 items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Link href="/" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('home')}</Link>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
          <Link href="/catalog" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('catalog')}</Link>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
          <span className="truncate text-gold">{name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="animate-page-in lg:sticky lg:top-28 lg:col-span-7 lg:self-start">
            <PhotoGallery images={product.images ?? []} alt={name} />
          </div>

          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="animate-page-in [animation-delay:120ms]">
              {product.condition && (
                <span className="mb-5 inline-flex items-center gap-2 border border-gold/25 bg-card px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${CONDITION_DOT[product.condition]}`} />
                  {t(`condition.${product.condition}`)}
                </span>
              )}
              <div className="flex items-start justify-between gap-4">
                <h1 className="heading-display text-4xl text-foreground md:text-5xl">{name}</h1>
                <FavoriteButton item={cardItem} className="mt-1 h-11 w-11 shrink-0 border border-gold/25" />
              </div>
              <p className="mt-4 font-mono text-[11px] tracking-wider text-muted-foreground">{t('sku', { sku: product.sku })}</p>
            </div>

            <div className="animate-page-in border-y border-gold/20 py-6 [animation-delay:200ms]">
              <p className="heading-display text-5xl text-gold-rich">
                {formatPrice(priceInfo.amount, priceInfo.currency, localeStr)}
              </p>
              {priceInfo.isConverted && priceInfo.originalEur && (
                <p className="mt-2 text-[11px] tracking-wide text-muted-foreground">
                  {formatPrice(priceInfo.originalEur, 'EUR', localeStr)} · {currency('converted')}
                </p>
              )}
            </div>

            <div className="animate-page-in [animation-delay:280ms]">
              <AddToCartButton
                product={product}
                label={t('addToCart')}
                inCartLabel={t('inCart')}
              />
              <Link
                href={`/contacts?item=${encodeURIComponent(product.sku)}#contact-form`}
                className="btn-ghost group mt-3 w-full"
              >
                <MessageCircle size={14} aria-hidden="true" className="text-gold transition-transform duration-500 ease-lux group-hover:-rotate-12" />
                {t('askAboutItem')}
              </Link>
            </div>

            {specs.length > 0 && (
              <dl className="flex flex-col">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-baseline gap-3 border-b border-gold/10 py-3 text-sm">
                    <dt className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{spec.label}</dt>
                    <span aria-hidden="true" className="mb-1 flex-1 border-b border-dotted border-gold/30" />
                    <dd className="text-right text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {provenance && (
              <figure className="relative bg-deep/70 px-6 py-6">
                <span aria-hidden="true" className="heading-display absolute -top-5 left-4 text-6xl leading-none text-gold/40">“</span>
                <figcaption className="eyebrow mb-3">{t('provenance')}</figcaption>
                <blockquote className="font-display text-lg italic leading-relaxed text-foreground/90">{provenance}</blockquote>
              </figure>
            )}

            {description && (
              <div className="space-y-4 text-[15px] leading-[1.8] text-muted-foreground">
                {description.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <AnimatedSection className="mt-28 border-t border-gold/15 pt-20">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 className="heading-display text-4xl text-foreground md:text-5xl">{t('similarItems')}</h2>
              <Link href="/catalog" className="link-lux hidden text-[11px] uppercase tracking-[0.22em] text-gold sm:inline">{nav('catalog')}</Link>
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
