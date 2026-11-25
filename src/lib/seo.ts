// Single source of truth for absolute URLs, canonical/hreflang links and page metadata.
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

export const SITE_NAME = 'VintagEmpire'

// Values copied from .env.example or local setups must never end up in canonical links
const PLACEHOLDER_HOST = /yourdomain|example\.(com|org)|localhost|127\.0\.0\.1/i

function originOf(value: string | undefined): string | null {
  if (!value || PLACEHOLDER_HOST.test(value)) return null
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null
  } catch {
    return null
  }
}

/**
 * Public origin of the shop, e.g. https://vintagempire.com.
 * Set NEXT_PUBLIC_SITE_URL to the production domain; until then the Railway domain is used.
 */
export function getSiteUrl(): string {
  return (
    originOf(process.env.NEXT_PUBLIC_SITE_URL) ??
    originOf(process.env.NEXT_PUBLIC_BASE_URL) ??
    originOf(process.env.RAILWAY_PUBLIC_DOMAIN) ??
    'http://localhost:3000'
  )
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, getSiteUrl()).toString()
}

/** `/catalog` → `/ru/catalog`; `/` → `/ru` */
export function localizedPath(locale: string, path = '/'): string {
  return `/${locale}${path === '/' ? '' : path}`
}

export function localizedUrl(locale: string, path = '/', query = ''): string {
  return absoluteUrl(localizedPath(locale, path)) + query
}

/** Canonical + hreflang for a page that exists in every locale. `query` is kept (pagination, category). */
export function localizedAlternates(locale: string, path = '/', query = ''): NonNullable<Metadata['alternates']> {
  return {
    canonical: localizedUrl(locale, path, query),
    languages: Object.fromEntries([
      ...routing.locales.map((l) => [l, localizedUrl(l, path, query)]),
      ['x-default', localizedUrl(routing.defaultLocale, path, query)],
    ]),
  }
}

const OG_LOCALES = new Map<string, string>([
  ['ru', 'ru_RU'],
  ['en', 'en_GB'],
  ['de', 'de_DE'],
])

export function ogLocale(locale: string): string {
  return OG_LOCALES.get(locale) ?? 'en_GB'
}

/** Branded share card for pages without their own picture (see /api/og) */
export function defaultOgImage(locale: string, title?: string) {
  const query = new URLSearchParams({ locale })
  if (title) query.set('title', title.slice(0, 90))
  return { url: absoluteUrl(`/api/og?${query.toString()}`), width: 1200, height: 630, alt: title ?? SITE_NAME }
}

export const NO_INDEX: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}

export interface PageSeo {
  locale: string
  /** Path without the locale prefix: `/catalog`, `/catalog/some-vase`, `/` */
  path: string
  title: string
  description?: string
  /** Query kept in canonical/hreflang, e.g. `?category=porcelain&page=2` */
  query?: string
  images?: { url: string; width?: number; height?: number; alt?: string }[]
  type?: 'website' | 'article'
  /** Title used as is, without the "— VintagEmpire" suffix (home page) */
  absoluteTitle?: boolean
  noindex?: boolean
  /** Extra Open Graph fields (article dates, tags) */
  openGraph?: Record<string, unknown>
}

export function pageMetadata(seo: PageSeo): Metadata {
  const url = localizedUrl(seo.locale, seo.path, seo.query ?? '')
  const images = seo.images?.length ? seo.images : [defaultOgImage(seo.locale, seo.absoluteTitle ? undefined : seo.title)]
  const description = seo.description ? clampDescription(seo.description) : undefined
  const fullTitle = seo.absoluteTitle ? seo.title : `${seo.title} — ${SITE_NAME}`

  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description,
    alternates: seo.noindex ? { canonical: url } : localizedAlternates(seo.locale, seo.path, seo.query ?? ''),
    robots: seo.noindex ? NO_INDEX : undefined,
    openGraph: {
      type: seo.type ?? 'website',
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: ogLocale(seo.locale),
      alternateLocale: routing.locales.filter((l) => l !== seo.locale).map(ogLocale),
      images,
      ...seo.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
  }
}

/** Search snippets show ~155–160 characters; cut on a word boundary and strip markup */
export function clampDescription(text: string, max = 158): string {
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:.\s-]+$/, '')}…`
}
