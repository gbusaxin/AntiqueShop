import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Antiques & Fine Art`,
    short_name: SITE_NAME,
    description: 'Antique and vintage porcelain, crystal, silver and fine art — one-of-a-kind pieces.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F1E8',
    theme_color: '#F6F1E8',
    icons: [{ src: '/brand-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  }
}
