import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

const TITLES: Record<string, string> = {
  en: 'Public Offer — Belle Époque',
  ru: 'Публичная оферта — Belle Époque',
  de: 'Öffentliches Angebot — Belle Époque',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: TITLES[locale] ?? TITLES.en,
    alternates: {
      canonical: `${BASE_URL}/${locale}/legal/offer`,
      languages: {
        en: `${BASE_URL}/en/legal/offer`,
        ru: `${BASE_URL}/ru/legal/offer`,
        de: `${BASE_URL}/de/legal/offer`,
        'x-default': `${BASE_URL}/en/legal/offer`,
      },
    },
  }
}

export default async function PublicOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.offer' })
  return <SiteContentPage pageKey="legal_offer" locale={locale} defaultTitle={t('title')} />
}
