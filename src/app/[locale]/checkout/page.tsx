import { getTranslations } from 'next-intl/server'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
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
  const t = await getTranslations({ locale, namespace: 'checkout' })
  return pageMetadata({ locale, path: '/checkout', title: t('title'), noindex: true })
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'checkout' })

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="heading-display mt-4 text-5xl text-foreground md:text-6xl">{t('title')}</h1>
        </div>
        <CheckoutForm locale={locale as Locale} paymentAvailability={getProviderAvailability()} />
      </div>
    </div>
  )
}
