import { getTranslations } from 'next-intl/server'
import { SiteContentPage } from '@/components/SiteContentPage'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [nav, seo] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'seo' }),
  ])
  return pageMetadata({ locale, path: '/about', title: nav('about'), description: seo('aboutDescription') })
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return <SiteContentPage pageKey="about" locale={locale} defaultTitle={t('title')} />
}
