'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

const CONSENT_KEY = 'cookie_consent'

type Consent = 'accepted' | 'declined'

function updatePostHogConsent(consent: Consent) {
  if (consent === 'declined') {
    if (posthog.__loaded) {
      posthog.opt_out_capturing()
      posthog.reset()
    }
    return
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      opt_out_capturing_by_default: true,
      persistence: 'localStorage+cookie',
      respect_dnt: true,
      sanitize_properties: (props) => {
        delete props['$ip']
        delete props['$current_url']
        return props
      },
    })
  }

  posthog.opt_in_capturing()
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === 'accepted') {
      updatePostHogConsent('accepted')
    }

    function onStorageChange(e: StorageEvent) {
      if (e.key !== CONSENT_KEY) return
      if (e.newValue === 'accepted' || e.newValue === 'declined') {
        updatePostHogConsent(e.newValue)
      }
    }

    function onConsentChange(e: Event) {
      const consent = (e as CustomEvent<{ consent: Consent }>).detail?.consent
      if (consent === 'accepted' || consent === 'declined') {
        updatePostHogConsent(consent)
      }
    }

    window.addEventListener('storage', onStorageChange)
    window.addEventListener('cookie-consent-changed', onConsentChange)

    return () => {
      window.removeEventListener('storage', onStorageChange)
      window.removeEventListener('cookie-consent-changed', onConsentChange)
    }
  }, [])

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return <>{children}</>

  return <PHProvider client={posthog}>{children}</PHProvider>
}
