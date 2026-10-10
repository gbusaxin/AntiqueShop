'use client'

import dynamic from 'next/dynamic'
import type { ContactMapSettings } from './mapSettings'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div role="status" className="flex h-72 items-center justify-center bg-muted text-xs text-muted-foreground">Loading map…</div>,
})

export function ContactsMap({ settings, locale = 'en' }: { settings: ContactMapSettings; locale?: string }) {
  const linkLabel = locale === 'ru' ? 'Открыть в OpenStreetMap' : locale === 'de' ? 'In OpenStreetMap öffnen' : 'Open in OpenStreetMap'
  const mapLabel = locale === 'ru' ? 'Расположение на карте' : locale === 'de' ? 'Standort auf der Karte' : 'Location on the map'
  const href = `https://www.openstreetmap.org/?mlat=${settings.latitude}&mlon=${settings.longitude}#map=${settings.zoom}/${settings.latitude}/${settings.longitude}`

  return (
    <div className="space-y-3">
      <div role="region" aria-label={mapLabel} className="relative z-0 overflow-hidden border border-primary/15">
        <LeafletMap {...settings} />
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
        {linkLabel}
      </a>
    </div>
  )
}
