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

export function getRegionFromRequest(req: Request): Region {
  const countryCode = req.headers.get('x-vercel-ip-country')
  const forwardedFor = req.headers.get('x-forwarded-for')
  const fallbackCountryCode = forwardedFor?.split(',')[0]?.trim()

  if (countryCode) return getRegionFromCountryCode(countryCode)
  if (fallbackCountryCode && /^[A-Za-z]{2}$/.test(fallbackCountryCode)) {
    return getRegionFromCountryCode(fallbackCountryCode)
  }

  return 'EU'
}

export function getCookieRegion(cookieStore: ReadonlyRequestCookies): Region | null {
  const region = cookieStore.get('user_region')?.value

  if (region && region in REGION_CURRENCIES) return region as Region

  return null
}
