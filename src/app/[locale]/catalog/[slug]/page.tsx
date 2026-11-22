import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { TransitionLink } from '@/components/transitions/ViewTransitions'
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'
const regionCurrencies = new Map(Object.entries(REGION_CURRENCIES))

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, slug, sku, category_id, name_ru, name_en, name_de, description_ru, description_en, description_de, provenance_ru, provenance_en, provenance_de, material, size, country_of_origin, year_circa, price_eur, price_override, images, is_available')
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
      <JsonLd data={jsonLd} />
      <ViewTracker slug={slug} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <nav aria-label={t('breadcrumbs')} className="mb-10 flex min-w-0 items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <TransitionLink href="/" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('home')}</TransitionLink>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
          <TransitionLink href="/catalog" className="link-lux shrink-0 transition-colors hover:text-foreground">{nav('catalog')}</TransitionLink>
          <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold/40" />
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
              <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{t('priceLabel')}</p>
              <p className="heading-display mt-2 text-5xl text-gold-rich">
                {formatPrice(priceInfo.amount, priceInfo.currency, localeStr)}
              </p>
              {priceInfo.isConverted && priceInfo.originalEur && (
                <p className="mt-2 text-[11px] tracking-wide text-muted-foreground">
                  {formatPrice(priceInfo.originalEur, 'EUR', localeStr)} · {currency('converted')}
                </p>
              )}
            </div>

            <div className="mt-8 animate-page-in [animation-delay:400ms]">
              <AddToCartButton
                product={product}
                label={t('addToCart')}
                inCartLabel={t('inCart')}
              />
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
                  <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.8] first-letter:text-gold-rich">{leadParagraph}</p>
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
