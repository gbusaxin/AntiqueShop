import type {Metadata, Viewport} from 'next'
import {getLocale} from 'next-intl/server'
import {getSiteUrl, SITE_NAME} from '@/lib/seo'
import {Cormorant_Garamond, Inter, Playfair_Display} from 'next/font/google'
import './globals.css'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {PostHogProvider} from '@/components/providers/PostHogProvider'

const inter = Inter({subsets: ['latin', 'cyrillic'], variable: '--font-inter'})
const playfair = Playfair_Display({subsets: ['latin', 'cyrillic'], variable: '--font-playfair-display'})
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  other: process.env.NEXT_PUBLIC_BING_VERIFICATION ? {'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION} : undefined,
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {default: SITE_NAME, template: `%s — ${SITE_NAME}`},
  description: 'Antique and vintage porcelain, crystal, silver and fine art — one-of-a-kind pieces.',
  applicationName: SITE_NAME,
  icons: {
    icon: {url: '/brand-icon.png', type: 'image/png', sizes: '512x512'},
    apple: {url: '/brand-icon.png', sizes: '512x512'},
  },
  manifest: '/manifest.webmanifest',
  formatDetection: {telephone: false, email: false, address: false},
  verification,
  openGraph: {siteName: SITE_NAME},
  twitter: {card: 'summary_large_image'},
}

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#F6F1E8'},
    {media: '(prefers-color-scheme: dark)', color: '#14110E'},
  ],
}


export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  // The locale comes from the URL prefix via next-intl; screen readers and search engines rely on it
  const locale = await getLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} antialiased`}>
        <ThemeProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
