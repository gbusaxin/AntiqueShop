import { createAdminClient } from '@/lib/supabaseServer'
import { routing } from '@/i18n/routing'
import { clampDescription, localizedUrl, SITE_NAME, getSiteUrl } from '@/lib/seo'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale } from '@/types'

export const dynamic = 'force-dynamic'

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Characters XML 1.0 does not allow (stray control codes from imported descriptions)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

const tag = (name: string, value: string | null | undefined) => (value ? `<${name}>${xml(value)}</${name}>` : '')

/**
 * Product feed for Google Merchant Center (Shopping ads, free listings) and Meta / Instagram catalogues,
 * which read the same format. One feed per language: /feeds/google.xml?lang=de
 * Prices are in EUR, the shop's base currency; shipping and tax are set up in Merchant Center.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('lang') ?? routing.defaultLocale
  const locale = ((routing.locales as readonly string[]).includes(requested) ? requested : routing.defaultLocale) as Locale

  const supabase = createAdminClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, sku, name_ru, name_en, name_de, description_ru, description_en, description_de, price_eur, images, material, year_circa, categories(name_ru, name_en, name_de)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[feed] failed to load products', error)
    return new Response('Feed temporarily unavailable', { status: 503 })
  }

  const items = (products ?? [])
    .filter((p) => Array.isArray(p.images) && p.images.length > 0 && (p.price_eur ?? 0) > 0)
    .map((p) => {
      const record = p as unknown as Record<string, string | null | undefined>
      const name = getLocalizedField(record, 'name', locale)
      const description = getLocalizedField(record, 'description', locale) || name
      const category = p.categories as unknown as Record<string, string | null | undefined> | null
      const images = (p.images as string[]).filter((src) => /^https:\/\//.test(src))

      return [
        '<item>',
        tag('g:id', p.sku || p.id),
        tag('g:title', name.slice(0, 150)),
        tag('g:description', clampDescription(description, 4900)),
        tag('g:link', localizedUrl(locale, `/catalog/${p.slug}`)),
        tag('g:image_link', images[0]),
        ...images.slice(1, 11).map((src) => tag('g:additional_image_link', src)),
        tag('g:availability', 'in_stock'),
        tag('g:price', `${Number(p.price_eur).toFixed(2)} EUR`),
        // Every piece is pre-owned and one of a kind: no GTIN/MPN exists
        tag('g:condition', 'used'),
        tag('g:identifier_exists', 'no'),
        tag('g:product_type', category ? getLocalizedField(category, 'name', locale) : null),
        tag('g:material', p.material),
        tag('g:custom_label_0', p.year_circa ? String(p.year_circa) : null),
        '</item>',
      ].join('')
    })

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    tag('title', `${SITE_NAME} — ${locale.toUpperCase()}`),
    tag('link', getSiteUrl()),
    tag('description', `${SITE_NAME} product feed`),
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Merchant Center fetches it on a schedule; an hour of caching keeps the database calm
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    },
  })
}
