import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createAdminClient } from '@/lib/supabaseServer'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice, getPriceForRegion } from '@/lib/getPriceForRegion'
import { getExchangeRates } from '@/lib/exchangeRates'
import { getCookieRegion, getRegionFromCountryCode } from '@/lib/region'
import { PhotoGallery } from '@/components/product/PhotoGallery'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { ViewTracker } from '@/components/product/ViewTracker'
import { ProductCard } from '@/components/ProductCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { JsonLd } from '@/components/JsonLd'
import { cookies, headers } from 'next/headers'
import type { Product, Locale, ProductCondition, Region } from '@/types'
import type { Metadata } from 'next'

const CONDITION_STYLES: Record<ProductCondition, string> = {
  excellent: 'border-emerald-400/40 text-emerald-400 bg-emerald-400/5',
  very_good: 'border-emerald-300/40 text-emerald-300 bg-emerald-300/5',
  good: 'border-amber-400/40 text-amber-400 bg-amber-400/5',
  fair: 'border-orange-400/40 text-orange-400 bg-orange-400/5',
}

const CONDITION_LABELS: Record<ProductCondition, string> = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
  fair: 'Fair',
}

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('products').select('slug').eq('is_available', true)
    return (data ?? []).map(({ slug }) => ({ slug }))
  } catch {
    return []
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('products')
      .select('name_en, name_ru, name_de, description_en, images, price_eur')
      .eq('slug', slug)
      .single()

    if (!data) return { title: 'Product — Belle Époque' }

    const name = getLocalizedField(data as Record<string, string | null | undefined>, 'name', locale as Locale)
    const description = (data.description_en ?? '').slice(0, 160)
    const ogImage = Array.isArray(data.images) && data.images[0] ? data.images[0] : undefined

    return {
      title: `${name} — Belle Époque`,
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
        title: `${name} — Belle Époque`,
        description,
        siteName: 'Belle Époque',
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 800, alt: name }] } : {}),
      },
    }
  } catch {
    return { title: 'Product — Belle Époque' }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations('product')

  const supabase = createAdminClient()
  const { data: raw } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!raw) notFound()

  const product = raw as Product
  const productRecord = product as unknown as Record<string, string | null | undefined>
  const name = getLocalizedField(productRecord, 'name', locale as Locale)
  const description = getLocalizedField(productRecord, 'description', locale as Locale)
  const provenance = getLocalizedField(productRecord, 'provenance', locale as Locale)

  const { data: relatedRaw } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  const related = (relatedRaw ?? []) as Product[]

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'

  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieRegion = getCookieRegion(cookieStore as Parameters<typeof getCookieRegion>[0])
  const countryCode = headerStore.get('x-vercel-ip-country')
  const region: Region = cookieRegion ?? (countryCode ? getRegionFromCountryCode(countryCode) : 'EU')

  const exchangeRates = await getExchangeRates()
  const priceInfo = await getPriceForRegion(
    product.price_eur,
    product.price_override as { amount: number; currency: string } | null,
    region,
    exchangeRates
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description ?? undefined,
    image: product.images ?? [],
    offers: {
      '@type': 'Offer',
      priceCurrency: priceInfo.currency,
      price: priceInfo.amount,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/${locale}/catalog/${slug}`,
    },
    brand: {
      '@type': 'Organization',
      name: 'Belle Époque',
    },
  }

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <JsonLd data={jsonLd} />
      <ViewTracker slug={slug} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-wide text-gold/50">
          <Link href="/" className="hover:text-gold/80 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-gold/80 transition-colors">Catalog</Link>
          <span>/</span>
          <span className="text-gold/70">{name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <PhotoGallery images={product.images ?? []} alt={name} />
          </div>

          <div className="flex flex-col gap-6">
            {product.era && (
              <span className="w-fit border border-gold/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold/70">
                {product.era}
              </span>
            )}

            <h1 className="font-serif text-3xl leading-snug text-[#f4ead1] md:text-4xl">{name}</h1>

            {product.condition && (
              <div className="flex items-center gap-3">
                <span
                  className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] ${CONDITION_STYLES[product.condition]}`}
                >
                  {CONDITION_LABELS[product.condition]}
                </span>
                {product.year_circa && (
                  <span className="text-xs tracking-wide text-gold/50">c. {product.year_circa}</span>
                )}
              </div>
            )}

            <div className="border-y border-gold/10 py-5">
              <p className="font-serif text-3xl text-gold-rich tracking-wide">
                {formatPrice(priceInfo.amount, priceInfo.currency, localeStr)}
              </p>
              {priceInfo.isConverted && priceInfo.originalEur && (
                <p className="mt-1 text-[10px] text-gold/40 tracking-wide">
                  ≈ {formatPrice(priceInfo.originalEur, 'EUR', localeStr)} · converted from EUR
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {product.material && (
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[10px] uppercase tracking-[0.15em] text-gold/50">{t('material')}</span>
                  <span className="tracking-wide text-[#c8bfaa]/80">{product.material}</span>
                </div>
              )}
              {product.country_of_origin && (
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[10px] uppercase tracking-[0.15em] text-gold/50">{t('country')}</span>
                  <span className="tracking-wide text-[#c8bfaa]/80">{product.country_of_origin}</span>
                </div>
              )}
            </div>

            {provenance && (
              <div className="border-l-2 border-gold/40 pl-4">
                <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-gold/60">{t('provenance')}</p>
                <p className="text-xs italic leading-relaxed tracking-wide text-[#c8bfaa]/70">{provenance}</p>
              </div>
            )}

            {description && (
              <div className="text-xs leading-relaxed tracking-wide text-[#c8bfaa]/75 space-y-3">
                {description.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            <div className="pt-2">
              <AddToCartButton
                product={product}
                label={t('addToCart')}
                inCartLabel="In Cart"
              />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <AnimatedSection className="mt-20 border-t border-gold/10 pt-16">
            <h2 className="mb-8 font-serif text-2xl text-gold-rich">{t('similarItems')}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale as Locale} />
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  )
}
