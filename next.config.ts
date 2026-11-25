import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts')

const isDev = process.env.NODE_ENV === 'development'

/** The production domain from NEXT_PUBLIC_SITE_URL, if one is set */
function canonicalHost(): { host: string; origin: string } | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL
  if (!value || /yourdomain|example\.|localhost/i.test(value)) return null
  try {
    const url = new URL(value)
    return { host: url.host, origin: url.origin }
  } catch {
    return null
  }
}

// Google tag (GA4 / Google Ads) and Meta Pixel — loaded only after cookie consent
const AD_SCRIPT_HOSTS = 'https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://connect.facebook.net'
const AD_CONNECT_HOSTS = 'https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com https://*.doubleclick.net https://www.googleadservices.com https://www.facebook.com https://connect.facebook.net'
const AD_IMG_HOSTS = 'https://www.googletagmanager.com https://*.google-analytics.com https://www.google.com https://*.doubleclick.net https://www.googleadservices.com https://www.facebook.com'

const cspDirectives = [
  "default-src 'self'",
  isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://yookassa.ru https://browser.sentry-cdn.com https://eu-assets.i.posthog.com https://us-assets.i.posthog.com ${AD_SCRIPT_HOSTS}`
    : `script-src 'self' 'unsafe-inline' https://js.stripe.com https://yookassa.ru https://browser.sentry-cdn.com https://eu-assets.i.posthog.com https://us-assets.i.posthog.com ${AD_SCRIPT_HOSTS}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://*.supabase.co https://*.basemaps.cartocdn.com ${AD_IMG_HOSTS}`,
  `connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.yookassa.ru https://*.sentry.io https://o*.ingest.sentry.io https://eu.i.posthog.com https://us.i.posthog.com https://eu-assets.i.posthog.com https://us-assets.i.posthog.com https://app.posthog.com ${AD_CONNECT_HOSTS}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://yookassa.ru https://td.doubleclick.net https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Fonts read from disk by the product share-card generator (opengraph-image)
  outputFileTracingIncludes: {
    '/**': ['./assets/fonts/**/*', './data/etsy-import/**/*'],
  },
  images: {
    // AVIF first: roughly 20–30% lighter than WebP for photos, which dominate every page
    formats: ['image/avif', 'image/webp'],
    // Uploaded photos never change under the same URL
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    // One public domain for search engines and ads: www and the Railway domain redirect to it.
    // API routes are left alone so payment webhooks keep working on any host.
    const site = canonicalHost()
    if (!site) return []
    const aliases = [`www.${site.host}`, process.env.RAILWAY_PUBLIC_DOMAIN].filter(
      (alias): alias is string => Boolean(alias) && alias !== site.host
    )
    return aliases.flatMap((alias) => {
      const has = [{ type: 'host' as const, value: alias.replace(/\./g, '\\.') }]
      return [
        { source: '/', has, destination: `${site.origin}/`, statusCode: 301 as const },
        { source: '/:path((?!api/).+)', has, destination: `${site.origin}/:path`, statusCode: 301 as const },
      ]
    })
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
