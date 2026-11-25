'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { ADS_ID, ensureTagQueues, GA_ID, hasMarketingConsent, META_PIXEL_ID } from '@/lib/analytics'

const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' }
const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }

/**
 * Google tag (GA4 + Google Ads) and Meta Pixel, loaded only after the visitor accepts cookies
 * (Google Consent Mode v2, basic mode). Each tag is enabled by its ID in the environment.
 */
export function MarketingTags() {
  const [consented, setConsented] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const enabled = Boolean(GA_ID || ADS_ID || META_PIXEL_ID)

  useEffect(() => {
    if (!enabled) return
    const apply = () => {
      const accepted = hasMarketingConsent()
      if (accepted) {
        ensureTagQueues()
        window.gtag?.('consent', 'default', GRANTED)
        if (GA_ID) window.gtag?.('config', GA_ID, { send_page_view: false, anonymize_ip: true })
        if (ADS_ID) window.gtag?.('config', ADS_ID)
        if (META_PIXEL_ID) window.fbq?.('init', META_PIXEL_ID)
      } else {
        window.gtag?.('consent', 'update', DENIED)
        window.fbq?.('consent', 'revoke')
      }
      setConsented(accepted)
    }
    apply()

    const onConsent = () => apply()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cookie_consent') apply()
    }
    window.addEventListener('cookie-consent-changed', onConsent)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('cookie-consent-changed', onConsent)
      window.removeEventListener('storage', onStorage)
    }
  }, [enabled])

  // Page views on every client-side navigation (the app never reloads between pages)
  useEffect(() => {
    if (!consented) return
    const query = searchParams?.toString()
    const location = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`
    if (GA_ID) window.gtag?.('event', 'page_view', { page_location: location, page_title: document.title })
    if (META_PIXEL_ID) window.fbq?.('track', 'PageView')
  }, [consented, pathname, searchParams])

  if (!enabled || !consented) return null

  const googleId = GA_ID || ADS_ID
  return (
    <>
      {googleId && (
        <Script id="gtag-js" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleId)}`} strategy="afterInteractive" />
      )}
      {META_PIXEL_ID && <Script id="meta-pixel" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />}
    </>
  )
}
