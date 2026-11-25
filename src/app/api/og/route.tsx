import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { renderBrandOgImage } from '@/lib/og/productOgImage'
import { getSiteUrl } from '@/lib/seo'

export const runtime = 'nodejs'

/** Branded 1200×630 share card for pages without their own image: /api/og?locale=ru&title=… */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const requested = params.get('locale') ?? ''
  const locale = (routing.locales as readonly string[]).includes(requested) ? requested : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'seo' })

  const title = (params.get('title') ?? '').replace(/\s+/g, ' ').trim().slice(0, 90) || t('ogTagline')
  const image = await renderBrandOgImage({
    title,
    eyebrow: t('ogEyebrow'),
    footnote: new URL(getSiteUrl()).host,
  })

  // The card only depends on the query: let browsers and CDNs keep it for a day
  image.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400')
  return image
}
