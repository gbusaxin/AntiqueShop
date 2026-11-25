import { getTranslations } from 'next-intl/server'
import { CartContent } from '@/components/cart/CartContent'
import { getProviderAvailability } from '@/lib/paymentConfig'
import type { Locale } from '@/types'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cart' })
  return pageMetadata({ locale, path: '/cart', title: t('title'), noindex: true })
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cart' })

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-gold/15 pb-10">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="heading-display mt-5 text-5xl text-foreground md:text-6xl">{t('title')}</h1>
        </div>
        <CartContent locale={locale as Locale} paymentAvailability={getProviderAvailability()} />
      </div>
    </div>
  )
}
