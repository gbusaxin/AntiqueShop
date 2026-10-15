import type {Metadata} from 'next'
import {Inter, Playfair_Display} from 'next/font/google'
import './globals.css'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {PostHogProvider} from '@/components/providers/PostHogProvider'

const inter = Inter({subsets: ['latin', 'cyrillic'], variable: '--font-inter'})
const playfair = Playfair_Display({subsets: ['latin', 'cyrillic'], variable: '--font-playfair-display'})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'),
  title: 'VintagEmpire',
  description: 'Curated antiques of exceptional provenance',
  applicationName: 'VintagEmpire',
  icons: {
    icon: {url: '/brand-icon.png', type: 'image/png', sizes: '512x512'},
    apple: {url: '/brand-icon.png', sizes: '512x512'},
  },
  openGraph: {siteName: 'VintagEmpire'},
  twitter: {card: 'summary', title: 'VintagEmpire'},
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
