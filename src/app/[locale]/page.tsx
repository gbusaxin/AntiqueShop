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
import { pageMetadata } from '@/lib/seo'
import { organizationJsonLd, websiteJsonLd } from '@/lib/structuredData'
import { getSiteContent } from '@/components/SiteContentPage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const seo = await getTranslations({ locale, namespace: 'seo' })
  return pageMetadata({
    locale,
    path: '/',
    title: seo('homeTitle'),
    description: seo('homeDescription'),
    absoluteTitle: true,
  })
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

  const [seo, contacts] = await Promise.all([
    getTranslations({ locale, namespace: 'seo' }),
    getSiteContent('contacts'),
  ])
  const organization = organizationJsonLd(seo('homeDescription'), contacts?.metadata ?? {})
  const website = websiteJsonLd(locale)

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
      <JsonLd data={organization} />
      <JsonLd data={website} />
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
