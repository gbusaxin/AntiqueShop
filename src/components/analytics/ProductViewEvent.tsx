'use client'

import { useEffect } from 'react'
import { trackEcommerce, type AnalyticsItem } from '@/lib/analytics'

/** Reports a product view to the ad platforms (remarketing audiences, dynamic ads) */
export function ProductViewEvent({ item }: { item: AnalyticsItem }) {
  useEffect(() => {
    trackEcommerce('view_item', { value: item.price, items: [item] })
  }, [item])
  return null
}
