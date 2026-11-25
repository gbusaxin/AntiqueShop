import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { formatPrice } from '@/lib/getPriceForRegion'
import { OG_SIZE, renderProductOgImage } from '@/lib/og/productOgImage'
import { getSiteUrl } from '@/lib/seo'
import type { Locale } from '@/types'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'VintagEmpire'
// Cache the generated card; prices rarely change and the image is fetched by every link preview.
export const revalidate = 3600

const ALLOWED_IMAGE_HOST = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//

/** Satori cannot decode WebP (our upload format) → convert the cover to a compact JPEG data URI. */
async function toDataUri(url: string | undefined): Promise<string | undefined> {
  if (!url || !ALLOWED_IMAGE_HOST.test(url)) return undefined
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return undefined
    const input = Buffer.from(await res.arrayBuffer())
    const jpeg = await sharp(input).resize(760, 1000, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return undefined
  }
}

export default async function ProductOgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [{ data }, t, catalog] = await Promise.all([
    supabase
      .from('products')
      .select('name_ru, name_en, name_de, images, price_eur, year_circa, material')
      .eq('slug', slug)
      .maybeSingle(),
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'catalog' }),
  ])

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  const eyebrow = catalog('eyebrow')
  const footnote = new URL(getSiteUrl()).host

  if (!data) {
    return renderProductOgImage({ name: 'VintagEmpire', price: '', eyebrow, footnote })
  }

  const name = getLocalizedField(data as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)
  const material = data.material && catalog.has(`materials.${data.material}`) ? catalog(`materials.${data.material}`) : data.material
  const details = [data.year_circa ? t('circa', { year: data.year_circa }) : null, material].filter(Boolean).join(' · ')

  return renderProductOgImage({
    name,
    eyebrow,
    details: details || undefined,
    price: formatPrice(data.price_eur, 'EUR', localeStr),
    image: await toDataUri(Array.isArray(data.images) ? data.images[0] : undefined),
    footnote,
  })
}
