import type { Region } from '@/types'
import { REGION_CURRENCIES } from './region'

interface PriceOverride {
  amount: number
  currency: string
}

interface PriceInfo {
  amount: number
  currency: string
  isConverted: boolean
  rateDate?: string
  originalEur?: number
}

export async function getPriceForRegion(
  priceEur: number,
  priceOverride: PriceOverride | null | undefined,
  region: Region,
  exchangeRates: Record<string, number>
): Promise<PriceInfo> {
  const targetCurrency = REGION_CURRENCIES[region]

  if (priceOverride && priceOverride.currency === targetCurrency) {
    return { amount: priceOverride.amount, currency: targetCurrency, isConverted: false }
  }

  if (targetCurrency === 'EUR') {
    return { amount: priceEur, currency: 'EUR', isConverted: false }
  }

  const rate = exchangeRates[targetCurrency]
  if (!rate) {
    return { amount: priceEur, currency: 'EUR', isConverted: false }
  }

  return {
    amount: Math.round(priceEur * rate * 100) / 100,
    currency: targetCurrency,
    isConverted: true,
    originalEur: priceEur,
  }
}

export function validatePriceDeviation(
  expectedAmount: number,
  actualAmount: number,
  maxDeviationPercent = 2
): boolean {
  const deviation = Math.abs((actualAmount - expectedAmount) / expectedAmount) * 100
  return deviation <= maxDeviationPercent
}

export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}
