import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'

const TITLES: Record<string, string> = {
  en: 'Privacy Policy — VintagEmpire',
  ru: 'Политика конфиденциальности — VintagEmpire',
  de: 'Datenschutzrichtlinie — VintagEmpire',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ru' ? TITLES.ru : locale === 'de' ? TITLES.de : TITLES.en,
    alternates: {
      canonical: `${BASE_URL}/${locale}/legal/privacy`,
      languages: {
        en: `${BASE_URL}/en/legal/privacy`,
        ru: `${BASE_URL}/ru/legal/privacy`,
        de: `${BASE_URL}/de/legal/privacy`,
        'x-default': `${BASE_URL}/en/legal/privacy`,
      },
    },
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })
  return <SiteContentPage pageKey="legal_privacy" locale={locale} defaultTitle={t('title')} />
}
