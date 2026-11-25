import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PostHogProvider } from '@/components/providers/PostHogProvider'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-playfair-display', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

/**
 * <html>/<body> with fonts and app-wide providers. Rendered by the locale layout (so `lang` matches
 * the URL — the root layout can't know it) and by the admin layout.
 */
export function DocumentShell({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} antialiased`}>
        <ThemeProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
