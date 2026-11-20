import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabaseServer'
import { HeroSection, type HeroItem } from '@/components/home/HeroSection'
import { MaterialsMarquee } from '@/components/home/MaterialsMarquee'
import { FeaturedCarousel } from '@/components/home/FeaturedCarousel'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { JsonLd } from '@/components/JsonLd'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Product, Category, Locale } from '@/types'
import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'
const LOCALE_LABELS: Record<string, string> = {
  en: 'VintagEmpire — Antique Shop',
  ru: 'VintagEmpire — Антикварный магазин',
  de: 'VintagEmpire — Antiquitätengeschäft',
}
const LOCALE_DESCS: Record<string, string> = {
  en: 'Rare antique porcelain, crystal, silver and art objects from around the world.',
  ru: 'Редкий антикварный фарфор, хрусталь, серебро и предметы искусства со всего мира.',
  de: 'Seltenes antikes Porzellan, Kristall, Silber und Kunstobjekte aus aller Welt.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    title: locale === 'ru' ? LOCALE_LABELS.ru : locale === 'de' ? LOCALE_LABELS.de : LOCALE_LABELS.en,
    description: locale === 'ru' ? LOCALE_DESCS.ru : locale === 'de' ? LOCALE_DESCS.de : LOCALE_DESCS.en,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        ru: `${BASE_URL}/ru`,
        de: `${BASE_URL}/de`,
        'x-default': `${BASE_URL}/en`,
      },
    },
    openGraph: {
      type: 'website',
      url: `${BASE_URL}/${locale}`,
      title: locale === 'ru' ? LOCALE_LABELS.ru : locale === 'de' ? LOCALE_LABELS.de : LOCALE_LABELS.en,
      description: locale === 'ru' ? LOCALE_DESCS.ru : locale === 'de' ? LOCALE_DESCS.de : LOCALE_DESCS.en,
      siteName: 'VintagEmpire',
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })
  const tHome = await getTranslations({ locale, namespace: 'home' })

  const supabase = await createClient()

  const [{ data: rawProducts }, { data: rawCategories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  const products = (rawProducts ?? []) as Product[]
  const categories = (rawCategories ?? []) as Category[]

  const organizationJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VintagEmpire',
    url: BASE_URL,
    logo: `${BASE_URL}/brand-icon.png`,
    description: locale === 'ru' ? LOCALE_DESCS.ru : locale === 'de' ? LOCALE_DESCS.de : LOCALE_DESCS.en,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+43-1-512-44-20',
      email: 'gbusaxin@gmail.com',
      contactType: 'customer service',
      areaServed: ['AT', 'DE', 'RU', 'EU'],
      availableLanguage: ['English', 'Russian', 'German'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kärntner Ring 14',
      addressLocality: 'Vienna',
      postalCode: '1010',
      addressCountry: 'AT',
    },
    // TODO: restore Instagram link when account ready
  }

  const websiteJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VintagEmpire',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${locale}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const heroItems: HeroItem[] = products
    .filter((product) => Boolean(product.images?.[0]))
    .slice(0, 2)
    .map((product) => ({
      src: product.images[0],
      slug: product.slug,
      name: getLocalizedField(product as unknown as Record<string, string | null | undefined>, 'name', locale as Locale),
    }))

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <HeroSection
        title={t('title')}
        subtitle={t('subtitle')}
        ctaLabel={t('ctaButton')}
        secondaryLabel={tHome('heritageLink')}
        yearsValue="35+"
        yearsLabel={tHome('heritageYears')}
        items={heroItems}
      />

      <MaterialsMarquee />

      <FeaturedCarousel
        products={products}
        locale={locale as Locale}
        title={tHome('featured')}
      />

      <div className="border-t border-gold/15">
        <CategoriesGrid
          categories={categories}
          locale={locale as Locale}
          title={tCat('title')}
        />
      </div>

      <AboutTeaser />
    </div>
  )
}
