import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getSiteUrl } from '@/lib/seo'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

// Pages with no search value: personal areas, checkout steps and auth flows, in every locale
const PRIVATE_PATHS = ['/account', '/cart', '/checkout', '/auth', '/favorites']

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getSiteUrl()
  const host = (await headers()).get('x-forwarded-host') ?? (await headers()).get('host')

  // Any other host serving this app (the Railway domain once a custom domain is live, previews)
  // must not compete with the real domain in search results
  if (host && host.split(':')[0] !== new URL(siteUrl).hostname) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: [
          '/admin',
          '/api/',
          // Spelled out per locale: a wildcard like /*/cart would also block /ru/catalog/cartier-…
          ...routing.locales.flatMap((locale) => PRIVATE_PATHS.map((path) => `/${locale}${path}`)),
          '/*?*sort=',
          '/*?*search=',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
