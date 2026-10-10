import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

export function blogUrl(locale: string, path = '/blog') {
  const configured = process.env.NEXT_PUBLIC_BASE_URL
  if (!configured) return undefined
  try {
    const base = new URL(configured)
    if (!['http:', 'https:'].includes(base.protocol)) return undefined
    return new URL(`/${locale}${path}`, base).toString()
  } catch {
    return undefined
  }
}

export function blogAlternates(locale: string, path = '/blog', query = ''): Metadata['alternates'] {
  const canonical = blogUrl(locale, path)
  if (!canonical) return undefined
  return {
    canonical: canonical + query,
    languages: Object.fromEntries([
      ...routing.locales.map((language) => [language, blogUrl(language, path)! + query]),
      ['x-default', blogUrl(routing.defaultLocale, path)! + query],
    ]),
  }
}

export function blogListHref(page = 1, tag = '') {
  const query = new URLSearchParams()
  if (tag) query.set('tag', tag)
  if (page > 1) query.set('page', String(page))
  return `/blog${query.size ? `?${query.toString()}` : ''}`
}

export function blogDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date))
}
