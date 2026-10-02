'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

const COOKIE_KEY = 'cookie_consent'

function hasCookieConsent(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIE_KEY}=accepted`))
}

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'
  if (!key) return
  if (posthog.__loaded) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    respect_dnt: true,
    sanitize_properties: (props) => {
      delete props['$ip']
      delete props['$current_url']
      return props
    },
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (hasCookieConsent()) {
      initPostHog()
    }

    function onStorageChange(e: StorageEvent) {
      if (e.key !== COOKIE_KEY) return
      if (e.newValue === 'accepted') {
        initPostHog()
      } else if (e.newValue === 'declined') {
        if (posthog.__loaded) {
          posthog.opt_out_capturing()
        }
      }
    }

    function onConsentChange(e: Event) {
      const detail = (e as CustomEvent<{ consent: string }>).detail
      if (detail?.consent === 'accepted') {
        initPostHog()
      } else if (detail?.consent === 'declined') {
        if (posthog.__loaded) {
          posthog.opt_out_capturing()
        }
      }
    }

    window.addEventListener('storage', onStorageChange)
    window.addEventListener('cookie-consent-change', onConsentChange)

    return () => {
      window.removeEventListener('storage', onStorageChange)
      window.removeEventListener('cookie-consent-change', onConsentChange)
    }
  }, [])

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return <>{children}</>

  return <PHProvider client={posthog}>{children}</PHProvider>
}
