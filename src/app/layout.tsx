import type {Metadata} from 'next'
import {Inter, Playfair_Display} from 'next/font/google'
import './globals.css'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {PostHogProvider} from '@/components/providers/PostHogProvider'

const inter = Inter({subsets: ['latin', 'cyrillic'], variable: '--font-inter'})
const playfair = Playfair_Display({subsets: ['latin', 'cyrillic'], variable: '--font-playfair-display'})

export const metadata: Metadata = {title: 'Belle Époque', description: 'Curated antiques of exceptional provenance'}

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
