import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Belle Époque',
  description: 'Curating exceptional antique objects since 1987. Our story, our values, our team.',
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return <SiteContentPage pageKey="about" locale={locale} defaultTitle={t('title')} />
}
