import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { CartProvider } from '@/components/providers/CartProvider'
import { RegionProvider } from '@/components/providers/RegionProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CookieBanner } from '@/components/CookieBanner'
import { createClient } from '@/lib/supabaseServer'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

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
    <NextIntlClientProvider messages={messages} locale={locale}>
      <RegionProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar locale={locale} user={navUser} />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </div>
        </CartProvider>
      </RegionProvider>
    </NextIntlClientProvider>
  )
}
