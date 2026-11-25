import type { Locale, Region } from '@/types'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export const CIS_COUNTRIES = ['RU', 'BY', 'KZ', 'AM', 'KG', 'UZ', 'TJ', 'AZ', 'MD', 'GE']

export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'NO', 'CH', 'IS',
]

export const UK_COUNTRIES = ['GB']
export const US_COUNTRIES = ['US']
export const CA_AU = ['CA', 'AU']

export const REGION_CURRENCIES: Record<Region, string> = {
  EU: 'EUR',
  CIS: 'RUB',
  US: 'USD',
  UK: 'GBP',
  OTHER: 'EUR',
}

export const REGION_LABELS: Record<Region, Record<Locale, string>> = {
  EU: { ru: 'Европейский союз', en: 'European Union', de: 'Europäische Union' },
  CIS: { ru: 'СНГ', en: 'CIS', de: 'GUS' },
  US: { ru: 'США', en: 'United States', de: 'Vereinigte Staaten' },
  UK: { ru: 'Великобритания', en: 'United Kingdom', de: 'Vereinigtes Königreich' },
  OTHER: { ru: 'Другой регион', en: 'Other region', de: 'Andere Region' },
}

export function getRegionFromCountryCode(countryCode: string): Region {
  const normalizedCountryCode = countryCode.trim().toUpperCase()

  if (CIS_COUNTRIES.includes(normalizedCountryCode)) return 'CIS'
  if (EU_COUNTRIES.includes(normalizedCountryCode)) return 'EU'
  if (UK_COUNTRIES.includes(normalizedCountryCode)) return 'UK'
  if (US_COUNTRIES.includes(normalizedCountryCode)) return 'US'
  if (CA_AU.includes(normalizedCountryCode)) return 'OTHER'

  return 'OTHER'
}

/**
 * Best guess of the visitor's country without a geo-IP service: a CDN header when the host provides
 * one (Vercel, Cloudflare), else the region part of the browser language (de-AT → AT, en-US → US).
 */
export function guessCountryFromHeaders(headers: Pick<Headers, 'get'>): string | null {
  const geo = headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry')
  if (geo && /^[A-Za-z]{2}$/.test(geo) && geo.toUpperCase() !== 'XX') return geo.toUpperCase()

  const languages = (headers.get('accept-language') ?? '')
    .split(',')
    .map((part) => part.split(';')[0].trim())
    .filter(Boolean)
  for (const tag of languages) {
    const region = tag.split('-')[1]
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase()
  }
  // A bare "ru" usually means a Russian-speaking country; other bare languages say nothing about the country
  if (languages[0]?.toLowerCase() === 'ru') return 'RU'
  return null
}

export function getRegionFromHeaders(headers: Pick<Headers, 'get'>): Region {
  const country = guessCountryFromHeaders(headers)
  return country ? getRegionFromCountryCode(country) : 'EU'
}

export function getRegionFromRequest(req: Request): Region {
  return getRegionFromHeaders(req.headers)
}

export function getCookieRegion(cookieStore: ReadonlyRequestCookies): Region | null {
  const region = cookieStore.get('user_region')?.value

  if (region && region in REGION_CURRENCIES) return region as Region

  return null
}
