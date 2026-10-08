import { getTranslations } from 'next-intl/server'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout — Belle Époque',
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('checkout')

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Secure Purchase</p>
          <h1 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">{t('title')}</h1>
        </div>
        <CheckoutForm locale={locale as Locale} />
      </div>
    </div>
  )
}
