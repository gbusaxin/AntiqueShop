'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ContactMapSettings } from './mapSettings'

const locationIcon = divIcon({
  className: '',
  html: '<span style="display:block;width:20px;height:20px;border:3px solid white;border-radius:50%;background:#996e37;box-shadow:0 1px 5px #0008"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
})

function MapView({ latitude, longitude, zoom }: ContactMapSettings) {
  const map = useMap()
  useEffect(() => {
    map.setView([latitude, longitude], zoom)
  }, [map, latitude, longitude, zoom])
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function LeafletMap(settings: ContactMapSettings) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const tiles = dark ? 'dark_all' : 'light_all'

  return (
    <MapContainer center={[settings.latitude, settings.longitude]} zoom={settings.zoom} minZoom={1} maxZoom={19} scrollWheelZoom={false} style={{ height: 288, width: '100%' }}>
      <TileLayer
        key={tiles}
        url={`https://{s}.basemaps.cartocdn.com/${tiles}/{z}/{x}/{y}.png`}
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'}
        maxZoom={19}
      />
      <Marker position={[settings.latitude, settings.longitude]} icon={locationIcon} title={settings.address || 'Location'}>
        <Popup>{settings.address || `${settings.latitude}, ${settings.longitude}`}</Popup>
      </Marker>
      <MapView {...settings} />
    </MapContainer>
  )
}
