import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabaseServer'
import { routing } from '@/i18n/routing'
import { localizedUrl } from '@/lib/seo'

// Built per request from the database, so a new or sold piece shows up immediately
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]

/** One entry per locale, each listing every language version (hreflang in the sitemap) */
function localizedEntries(
  path: string,
  options: Omit<Entry, 'url' | 'alternates'> & { query?: string } = {}
): Entry[] {
  const { query = '', ...rest } = options
  const languages = Object.fromEntries([
    ...routing.locales.map((locale) => [locale, localizedUrl(locale, path, query)]),
    ['x-default', localizedUrl(routing.defaultLocale, path, query)],
  ])
  return routing.locales.map((locale) => ({
    url: localizedUrl(locale, path, query),
    alternates: { languages },
    ...rest,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const [{ data: products }, { data: categories }, { data: posts }] = await Promise.all([
    supabase
      .from('products')
      .select('slug, updated_at, images')
      .eq('is_available', true)
      .order('updated_at', { ascending: false }),
    supabase.from('categories').select('slug, updated_at').eq('is_active', true).order('sort_order'),
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString()),
  ])

  const latestProduct = products?.[0]?.updated_at ? new Date(products[0].updated_at) : new Date()

  const pages: Entry[] = [
    ...localizedEntries('/', { lastModified: latestProduct, changeFrequency: 'daily', priority: 1 }),
    ...localizedEntries('/catalog', { lastModified: latestProduct, changeFrequency: 'daily', priority: 0.9 }),
    ...(categories ?? []).flatMap((category) =>
      localizedEntries('/catalog', {
        query: `?category=${encodeURIComponent(category.slug)}`,
        lastModified: latestProduct,
        changeFrequency: 'daily',
        priority: 0.8,
      })
    ),
    ...(products ?? []).flatMap((product) =>
      localizedEntries(`/catalog/${product.slug}`, {
        lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
        // Image sitemap: product photos are what people search for in Google Images
        images: (Array.isArray(product.images) ? (product.images as string[]) : [])
          .filter((src) => /^https:\/\//.test(src))
          .slice(0, 5),
      })
    ),
    ...(posts?.length ? localizedEntries('/blog', { changeFrequency: 'weekly', priority: 0.5 }) : []),
    ...(posts ?? []).flatMap((post) =>
      localizedEntries(`/blog/${post.slug}`, {
        lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    ),
    ...localizedEntries('/about', { changeFrequency: 'monthly', priority: 0.4 }),
    ...localizedEntries('/contacts', { changeFrequency: 'monthly', priority: 0.4 }),
    ...localizedEntries('/legal/offer', { changeFrequency: 'yearly', priority: 0.2 }),
    ...localizedEntries('/legal/privacy', { changeFrequency: 'yearly', priority: 0.2 }),
  ]

  return pages
}
