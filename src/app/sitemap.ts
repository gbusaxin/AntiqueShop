import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabaseServer'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'
const LOCALES = ['en', 'ru', 'de']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_available', true)

  const staticPaths = ['', '/catalog', '/about', '/contacts', '/legal/offer', '/legal/privacy']

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1.0 : 0.7,
    }))
  )

  const productEntries: MetadataRoute.Sitemap = (products ?? []).flatMap((product) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/catalog/${product.slug}`,
      lastModified: new Date(product.updated_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  return [...staticEntries, ...productEntries]
}
