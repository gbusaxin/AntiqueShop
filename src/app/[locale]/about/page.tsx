import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const nav = await getTranslations({ locale, namespace: 'nav' })
  return {
    title: `${nav('about')} — Belle Époque`,
    description: t('description'),
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return <SiteContentPage pageKey="about" locale={locale} defaultTitle={t('title')} />
}
