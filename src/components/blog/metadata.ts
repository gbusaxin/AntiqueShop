import type { Metadata } from 'next'
import { localizedAlternates, localizedUrl } from '@/lib/seo'

export function blogUrl(locale: string, path = '/blog') {
  return localizedUrl(locale, path)
}

export function blogAlternates(locale: string, path = '/blog', query = ''): Metadata['alternates'] {
  return localizedAlternates(locale, path, query)
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
