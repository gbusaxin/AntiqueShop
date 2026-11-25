import type {Metadata, Viewport} from 'next'
import {getSiteUrl, SITE_NAME} from '@/lib/seo'
import './globals.css'

const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  other: process.env.NEXT_PUBLIC_BING_VERIFICATION ? {'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION} : undefined,
}

// A function, not a constant: the site URL may come from the runtime environment (Railway domain)
export async function generateMetadata(): Promise<Metadata> {
  return {
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
}

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#F6F1E8'},
    {media: '(prefers-color-scheme: dark)', color: '#14110E'},
  ],
}


// <html> and <body> are rendered by app/[locale]/layout.tsx (with the right `lang`) and app/admin/layout.tsx;
// the root not-found and error pages render their own document.
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return children
}
