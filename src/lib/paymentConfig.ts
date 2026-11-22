// Server-only: reads secrets. Never import from a client component.
import type { ProviderAvailability } from '@/lib/getPaymentProvidersForRegion'

/** A value copied from .env.example (`your-shop-id`, `sk_live_...`) is not a real credential */
function isRealSecret(value: string | undefined): value is string {
  return Boolean(value) && !/^your[-_]|\.\.\.$/i.test(value as string)
}

/** Which payment providers this deployment can actually charge with. Server-only: reads secrets. */
export function getProviderAvailability(): ProviderAvailability {
  return {
    yookassa: isRealSecret(process.env.YOOKASSA_SHOP_ID) && isRealSecret(process.env.YOOKASSA_SECRET_KEY),
  }
}

export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY
  return isRealSecret(key) ? key : null
}
