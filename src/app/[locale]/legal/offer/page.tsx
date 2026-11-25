import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'


const TITLES: Record<string, string> = {
  en: 'Public Offer — VintagEmpire',
  ru: 'Публичная оферта — VintagEmpire',
  de: 'Öffentliches Angebot — VintagEmpire',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const seo = await getTranslations({ locale, namespace: 'seo' })
  const title = (locale === 'ru' ? TITLES.ru : locale === 'de' ? TITLES.de : TITLES.en).replace(/\s+—\s+VintagEmpire$/, '')
  return pageMetadata({ locale, path: '/legal/offer', title, description: seo('offerDescription') })
}

export default async function PublicOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.offer' })
  return <SiteContentPage pageKey="legal_offer" locale={locale} defaultTitle={t('title')} />
}
