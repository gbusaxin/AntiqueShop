import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabaseServer'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedCarousel } from '@/components/home/FeaturedCarousel'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { JsonLd } from '@/components/JsonLd'
import type { Product, Category, Locale } from '@/types'
import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'
const LOCALE_LABELS: Record<string, string> = {
  en: 'Belle Époque — Antique Shop',
  ru: 'Belle Époque — Антикварный магазин',
  de: 'Belle Époque — Antiquitätengeschäft',
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
    title: LOCALE_LABELS[locale] ?? LOCALE_LABELS['en'],
    description: LOCALE_DESCS[locale] ?? LOCALE_DESCS['en'],
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
      title: LOCALE_LABELS[locale] ?? LOCALE_LABELS['en'],
      description: LOCALE_DESCS[locale] ?? LOCALE_DESCS['en'],
      siteName: 'Belle Époque',
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('hero')
  const tCat = await getTranslations('categories')

  const supabase = await createClient()

  const [{ data: rawProducts }, { data: rawCategories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  const products = (rawProducts ?? []) as Product[]
  const categories = (rawCategories ?? []) as Category[]

  const organizationJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Belle Époque',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: LOCALE_DESCS[locale] ?? LOCALE_DESCS['en'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+43-1-512-44-20',
      email: 'info@belleepoque.art',
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
    sameAs: ['https://www.instagram.com/belleepoque.art'],
  }

  const websiteJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Belle Époque',
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

  return (
    <div className="bg-[#0a1f18] text-[#f4ead1]">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <HeroSection
        title={t('title')}
        subtitle={t('subtitle')}
        ctaLabel={t('ctaButton')}
      />

      <div className="border-t border-gold/10">
        <FeaturedCarousel
          products={products}
          locale={locale as Locale}
          title="Featured Pieces"
        />
      </div>

      <div className="border-t border-gold/10">
        <CategoriesGrid
          categories={categories}
          locale={locale as Locale}
          title={tCat('title')}
        />
      </div>

      <div className="border-t border-gold/10">
        <AboutTeaser />
      </div>

      <section className="border-t border-gold/10 bg-[#06150f] py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/60">Stay Informed</p>
          <h2 className="mt-4 font-serif text-2xl text-gold-rich md:text-3xl">
            New Acquisitions & Exhibitions
          </h2>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed tracking-wide text-[#c8bfaa]/65">
            Subscribe to receive curated updates on our latest arrivals, exclusive previews,
            and upcoming events for collectors.
          </p>
          <form className="mt-8 flex max-w-sm mx-auto gap-0">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 border border-gold/30 bg-transparent px-4 py-3 text-xs tracking-wide text-[#f4ead1] placeholder:text-[#f4ead1]/30 focus:border-gold/60 focus:outline-none"
            />
            <button
              type="submit"
              className="border border-l-0 border-gold/30 bg-gold/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold/80 transition-colors hover:bg-gold/20 hover:text-gold-rich"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
