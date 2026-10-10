import { z } from 'zod'

export const contactMetadataSchema = z.object({
  address: z.string().max(2000, 'Address must be at most 2000 characters').optional(),
  phone: z.string().max(2000).optional(),
  email: z.string().max(2000).optional(),
  working_hours: z.string().max(2000).optional(),
  map_coordinates: z.string().max(2000).optional(),
  latitude: z.number().finite().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  longitude: z.number().finite().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  zoom: z.number().int('Zoom must be a whole number').min(1, 'Zoom must be between 1 and 19').max(19, 'Zoom must be between 1 and 19').optional(),
}).catchall(z.unknown()).refine(
  (metadata) => (metadata.latitude === undefined) === (metadata.longitude === undefined),
  'Enter both latitude and longitude, or leave both empty',
)

export type ContactMapSettings = {
  latitude: number
  longitude: number
  zoom: number
  address: string
}

export function getContactMapSettings(metadata: Record<string, unknown>): ContactMapSettings | null {
  let latitude = metadata.latitude
  let longitude = metadata.longitude
  if (latitude === undefined && longitude === undefined && typeof metadata.map_coordinates === 'string') {
    const coordinates = metadata.map_coordinates.split(',').map((value) => value.trim())
    if (coordinates.length === 2 && coordinates.every(Boolean)) {
      latitude = Number(coordinates[0])
      longitude = Number(coordinates[1])
    }
  }
  const parsed = contactMetadataSchema.safeParse({
    latitude,
    longitude,
    zoom: metadata.zoom ?? 14,
    address: metadata.address ?? '',
  })
  if (!parsed.success || parsed.data.latitude === undefined || parsed.data.longitude === undefined) return null
  return {
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    zoom: parsed.data.zoom ?? 14,
    address: parsed.data.address ?? '',
  }
}
