'use client'
// Ecommerce events for ad platforms (Google Ads / GA4, Meta) and PostHog.
// Nothing is sent unless the visitor accepted cookies: the tags are only loaded after consent.
import posthog from 'posthog-js'

export interface AnalyticsItem {
  id: string
  name: string
  price: number
  category?: string | null
  quantity?: number
}

type GtagFn = (...args: unknown[]) => void
type FbqFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
    fbq?: FbqFn
  }
}

const CONSENT_KEY = 'cookie_consent'

export const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || ''
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ''
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

export function hasMarketingConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

/**
 * Queues for gtag and fbq, the same stubs the official snippets create. Events sent before the
 * scripts finish loading wait in the queue instead of being lost. Only created after consent.
 */
export function ensureTagQueues() {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return
  if ((GA_ID || ADS_ID) && !window.gtag) {
    window.dataLayer = window.dataLayer ?? []
    window.gtag = function gtag() {
      // gtag.js expects the arguments object itself, not an array
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
  }
  if (META_PIXEL_ID && !window.fbq) {
    const queue: unknown[] = []
    const fbq = ((...args: unknown[]) => {
      const self = fbq as unknown as { callMethod?: (...a: unknown[]) => void }
      if (self.callMethod) self.callMethod(...args)
      else queue.push(args)
    }) as FbqFn & Record<string, unknown>
    Object.assign(fbq, { queue, loaded: true, version: '2.0', push: fbq })
    window.fbq = fbq
    ;(window as unknown as { _fbq?: FbqFn })._fbq = fbq
  }
}

const META_EVENTS = new Map<string, string>([
  ['view_item', 'ViewContent'],
  ['add_to_cart', 'AddToCart'],
  ['begin_checkout', 'InitiateCheckout'],
  ['purchase', 'Purchase'],
])

export interface EcommerceEvent {
  value: number
  currency?: string
  items: AnalyticsItem[]
  transactionId?: string
}

/** GA4 ecommerce event, mirrored to Meta Pixel and PostHog */
export function trackEcommerce(name: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase', event: EcommerceEvent) {
  if (typeof window === 'undefined') return
  ensureTagQueues()
  const currency = event.currency ?? 'EUR'
  const value = Math.round(event.value * 100) / 100

  window.gtag?.('event', name, {
    currency,
    value,
    ...(event.transactionId ? { transaction_id: event.transactionId } : {}),
    items: event.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity ?? 1,
      ...(item.category ? { item_category: item.category } : {}),
    })),
  })

  // Google Ads conversion for the purchase (label from the Ads conversion action)
  const purchaseLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL
  if (name === 'purchase' && ADS_ID && purchaseLabel) {
    window.gtag?.('event', 'conversion', {
      send_to: `${ADS_ID}/${purchaseLabel}`,
      value,
      currency,
      transaction_id: event.transactionId,
    })
  }

  const metaEvent = META_EVENTS.get(name)
  if (metaEvent) {
    window.fbq?.(
      'track',
      metaEvent,
      {
        value,
        currency,
        content_type: 'product',
        content_ids: event.items.map((item) => item.id),
        contents: event.items.map((item) => ({ id: item.id, quantity: item.quantity ?? 1 })),
        num_items: event.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      },
      // Deduplicates with a future server-side Conversions API event
      event.transactionId ? { eventID: `${name}-${event.transactionId}` } : undefined
    )
  }

  if (posthog.__loaded) {
    posthog.capture(name, { value, currency, item_ids: event.items.map((item) => item.id), transaction_id: event.transactionId })
  }
}

/** Fires once per order even if the success page is reloaded */
export function trackPurchaseOnce(orderId: string, event: Omit<EcommerceEvent, 'transactionId'>) {
  const key = `purchase-tracked:${orderId}`
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: still report, duplicates are deduplicated by transaction_id
  }
  trackEcommerce('purchase', { ...event, transactionId: orderId })
}
