import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { CartProvider } from '@/components/providers/CartProvider'
import { RegionProvider } from '@/components/providers/RegionProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CookieBanner } from '@/components/CookieBanner'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <RegionProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </div>
        </CartProvider>
      </RegionProvider>
    </NextIntlClientProvider>
  )
}
