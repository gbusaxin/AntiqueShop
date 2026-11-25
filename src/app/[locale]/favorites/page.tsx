import { getTranslations } from 'next-intl/server'
import { FavoritesClient } from '@/components/favorites/FavoritesClient'
import type { Locale } from '@/types'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'favorites' })
  return pageMetadata({ locale, path: '/favorites', title: t('title'), noindex: true })
}

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'favorites' })

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-12 border-b border-gold/15 pb-10">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="heading-display mt-5 text-5xl text-foreground md:text-6xl">{t('title')}</h1>
        </div>
        <FavoritesClient locale={locale as Locale} />
      </div>
    </div>
  )
}
