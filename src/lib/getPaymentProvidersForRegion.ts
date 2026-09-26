import type { PaymentMethod, PaymentProvider, Region } from '@/types'

const PAYMENT_METHODS: Record<string, PaymentMethod[]> = {
  stripe: [
    { id: 'card', label: { ru: 'Карта', en: 'Card', de: 'Karte' }, icon: 'credit-card', provider: 'stripe' },
    { id: 'apple_pay', label: { ru: 'Apple Pay', en: 'Apple Pay', de: 'Apple Pay' }, icon: 'apple', provider: 'stripe' },
    { id: 'google_pay', label: { ru: 'Google Pay', en: 'Google Pay', de: 'Google Pay' }, icon: 'google', provider: 'stripe' },
    { id: 'sepa', label: { ru: 'SEPA', en: 'SEPA', de: 'SEPA' }, icon: 'bank', provider: 'stripe' },
    { id: 'klarna', label: { ru: 'Klarna', en: 'Klarna', de: 'Klarna' }, icon: 'klarna', provider: 'stripe' },
  ],
  yookassa: [
    { id: 'bank_card', label: { ru: 'Банковская карта', en: 'Bank card', de: 'Bankkarte' }, icon: 'credit-card', provider: 'yookassa' },
    { id: 'sbp', label: { ru: 'СБП', en: 'SBP', de: 'SBP' }, icon: 'qr-code', provider: 'yookassa' },
    { id: 'yoo_money', label: { ru: 'ЮMoney', en: 'YooMoney', de: 'YooMoney' }, icon: 'wallet', provider: 'yookassa' },
    { id: 'mir', label: { ru: 'МИР', en: 'MIR', de: 'MIR' }, icon: 'credit-card', provider: 'yookassa' },
  ],
}

export function getPaymentProvidersForRegion(region: Region): PaymentProvider[] {
  return region === 'CIS' ? ['yookassa'] : ['stripe']
}

export function getPaymentMethodsForRegion(region: Region): PaymentMethod[] {
  return getPaymentProvidersForRegion(region).flatMap(
    (provider) => PAYMENT_METHODS[provider] ?? []
  )
}
