import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'


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
  const seo = await getTranslations({ locale, namespace: 'seo' })
  const title = (locale === 'ru' ? TITLES.ru : locale === 'de' ? TITLES.de : TITLES.en).replace(/\s+—\s+VintagEmpire$/, '')
  return pageMetadata({ locale, path: '/legal/privacy', title, description: seo('privacyDescription') })
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })
  return <SiteContentPage pageKey="legal_privacy" locale={locale} defaultTitle={t('title')} />
}
