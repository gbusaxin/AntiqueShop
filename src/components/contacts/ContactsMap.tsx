'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { ContactMapSettings } from './mapSettings'

function MapLoading() {
  const t = useTranslations('common')
  return <div role="status" className="flex h-72 items-center justify-center bg-muted text-xs text-muted-foreground">{t('loading')}</div>
}

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: MapLoading,
})

export function ContactsMap({ settings }: { settings: ContactMapSettings; locale?: string }) {
  const t = useTranslations('contacts.map')
  const href = `https://www.openstreetmap.org/?mlat=${settings.latitude}&mlon=${settings.longitude}#map=${settings.zoom}/${settings.latitude}/${settings.longitude}`

  return (
    <div className="space-y-3">
      <div role="region" aria-label={t('label')} className="relative z-0 overflow-hidden border border-primary/15">
        <LeafletMap {...settings} />
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
        {t('open')}
      </a>
    </div>
  )
}
