import type { PaymentMethod, PaymentProvider, Region } from '@/types'

export interface ProviderAvailability {
  /** YooKassa needs a Russian merchant contract; without keys CIS buyers pay through Stripe */
  yookassa: boolean
}

// Klarna in EUR only works for buyers in euro countries where Klarna has a consumer offering
const KLARNA_EUR_COUNTRIES = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'NL', 'PT']

const STRIPE_METHODS: PaymentMethod[] = [
  { id: 'card', label: { ru: 'Банковская карта', en: 'Card', de: 'Karte' }, icon: 'credit-card', provider: 'stripe' },
  { id: 'apple_pay', label: { ru: 'Apple Pay', en: 'Apple Pay', de: 'Apple Pay' }, icon: 'apple', provider: 'stripe', wallet: 'apple_pay' },
  { id: 'google_pay', label: { ru: 'Google Pay', en: 'Google Pay', de: 'Google Pay' }, icon: 'google', provider: 'stripe', wallet: 'google_pay' },
  { id: 'sepa', label: { ru: 'SEPA (списание со счёта)', en: 'SEPA Direct Debit', de: 'SEPA-Lastschrift' }, icon: 'bank', provider: 'stripe', regions: ['EU'] },
  { id: 'klarna', label: { ru: 'Klarna', en: 'Klarna', de: 'Klarna' }, icon: 'klarna', provider: 'stripe', countries: KLARNA_EUR_COUNTRIES },
]

const YOOKASSA_METHODS: PaymentMethod[] = [
  { id: 'bank_card', label: { ru: 'Банковская карта', en: 'Bank card', de: 'Bankkarte' }, icon: 'credit-card', provider: 'yookassa' },
  { id: 'sbp', label: { ru: 'СБП', en: 'SBP', de: 'SBP' }, icon: 'qr-code', provider: 'yookassa' },
  { id: 'yoo_money', label: { ru: 'ЮMoney', en: 'YooMoney', de: 'YooMoney' }, icon: 'wallet', provider: 'yookassa' },
  { id: 'mir', label: { ru: 'МИР', en: 'MIR', de: 'MIR' }, icon: 'credit-card', provider: 'yookassa' },
]

/** Stripe Checkout `payment_method_types` for the method the buyer picked. Wallets ride on `card`. */
export const STRIPE_METHOD_TYPES = new Map<string, ('card' | 'sepa_debit' | 'klarna')[]>([
  ['card', ['card']],
  ['apple_pay', ['card']],
  ['google_pay', ['card']],
  ['sepa', ['sepa_debit']],
  ['klarna', ['klarna']],
])

/** YooKassa `payment_method_data.type` for the method the buyer picked. MIR is a bank card. */
export const YOOKASSA_METHOD_TYPES = new Map<string, string>([
  ['bank_card', 'bank_card'],
  ['sbp', 'sbp'],
  ['yoo_money', 'yoo_money'],
  ['mir', 'bank_card'],
])

export function getPaymentProvidersForRegion(
  region: Region,
  availability: ProviderAvailability = { yookassa: false }
): PaymentProvider[] {
  return region === 'CIS' && availability.yookassa ? ['yookassa'] : ['stripe']
}

export function getPaymentProvider(region: Region, availability: ProviderAvailability): PaymentProvider {
  return getPaymentProvidersForRegion(region, availability)[0]
}

/** Methods offered for a shipping country. `country` narrows region-wide lists (Klarna). */
export function getPaymentMethodsForRegion(
  region: Region,
  availability: ProviderAvailability = { yookassa: false },
  country?: string
): PaymentMethod[] {
  const methods = getPaymentProvider(region, availability) === 'yookassa' ? YOOKASSA_METHODS : STRIPE_METHODS
  const code = country?.trim().toUpperCase()
  return methods.filter((m) => {
    if (m.regions && !m.regions.includes(region)) return false
    if (m.countries && (!code || !m.countries.includes(code))) return false
    return true
  })
}

/** True when the buyer may pay for `country` with `methodId` — the server's check of the client's choice. */
export function isMethodAllowed(
  methodId: string,
  region: Region,
  availability: ProviderAvailability,
  country: string
): boolean {
  return getPaymentMethodsForRegion(region, availability, country).some((m) => m.id === methodId)
}
