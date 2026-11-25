import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { CartProvider } from '@/components/providers/CartProvider'
import { RegionProvider } from '@/components/providers/RegionProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CookieBanner } from '@/components/CookieBanner'
import { MotionProvider } from '@/components/providers/MotionProvider'
import { ViewTransitionsProvider } from '@/components/transitions/ViewTransitions'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { createClient } from '@/lib/supabaseServer'
import { Toaster } from 'sonner'
import { DocumentShell } from '@/components/DocumentShell'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Suspense } from 'react'
import { MarketingTags } from '@/components/analytics/MarketingTags'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!(routing.locales as readonly string[]).includes(locale)) notFound()
  setRequestLocale(locale)
  const supabasePromise = createClient()
  const [messages, { data: { user: authUser } }] = await Promise.all([
    getMessages({ locale }),
    supabasePromise.then((supabase) => supabase.auth.getUser()),
  ])
  const supabase = await supabasePromise

  let navUser: { email: string; isAdmin: boolean } | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()
    navUser = {
      email: authUser.email ?? '',
      isAdmin: profile?.role === 'admin',
    }
  }

  return (
    <DocumentShell lang={locale}>
    <NextIntlClientProvider messages={messages} locale={locale}>
      <RegionProvider>
        <CartProvider>
          <MotionProvider>
            <ViewTransitionsProvider>
              <div className="storefront relative flex min-h-screen flex-col">
                <ScrollProgress />
                <Navbar locale={locale} user={navUser} />
                <main className="flex-1">{children}</main>
                <Footer />
                <CookieBanner />
                <Suspense fallback={null}>
                  <MarketingTags />
                </Suspense>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    className: '!rounded-none !border !border-gold/30 !bg-card !text-foreground !font-sans !shadow-[var(--shadow-lux)]',
                  }}
                />
              </div>
            </ViewTransitionsProvider>
          </MotionProvider>
        </CartProvider>
      </RegionProvider>
    </NextIntlClientProvider>
    </DocumentShell>
  )
}
