'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const COOKIE_KEY = 'cookie_consent'

type ConsentState = 'accepted' | 'declined' | null

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(COOKIE_KEY)
    setConsent(stored === 'accepted' || stored === 'declined' ? stored : null)

    function onStorageChange(e: StorageEvent) {
      if (e.key !== COOKIE_KEY) return
      setConsent(e.newValue === 'accepted' || e.newValue === 'declined' ? e.newValue : null)
    }

    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  function choose(consent: 'accepted' | 'declined') {
    localStorage.setItem(COOKIE_KEY, consent)
    document.cookie = `${COOKIE_KEY}=${consent}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    setConsent(consent)
    setShowChoices(false)
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { consent } }))
  }

  if (!mounted) return null

  if (consent !== null && !showChoices) {
    return (
      <button
        type="button"
        onClick={() => setShowChoices(true)}
        className="fixed bottom-4 left-4 z-[100] border border-input bg-background px-3 py-2 text-[11px] text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Cookie settings
      </button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-input bg-background text-foreground"
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 pr-4">
              <p className="text-xs leading-relaxed text-foreground">
                We use cookies to improve your experience, analyze traffic, and personalize content.
                By clicking &ldquo;Accept&rdquo;, you consent to our use of cookies in accordance
                with{' '}
                <Link href="/en/legal/privacy" className="underline decoration-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  our Privacy Policy
                </Link>{' '}
                (GDPR / 152-ФЗ).
              </p>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        {
                          name: 'Essential',
                          desc: 'Required for the site to function. Cannot be disabled.',
                          always: true,
                        },
                        {
                          name: 'Analytics',
                          desc: 'Help us understand how visitors interact with the site (PostHog).',
                          always: false,
                        },
                        {
                          name: 'Preferences',
                          desc: 'Remember your language, region, and currency settings.',
                          always: false,
                        },
                      ].map((cat) => (
                        <div key={cat.name} className="rounded border border-input p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                              {cat.name}
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground"
                            >
                              {cat.always ? 'Always on' : 'Optional'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{cat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowDetails((v) => !v)}
                className="mt-2 text-[11px] text-foreground underline decoration-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {showDetails ? 'Hide details' : 'Cookie details'}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => choose('declined')}
                className="border border-primary/40 px-5 py-2 text-[11px] uppercase tracking-wider text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Decline
              </button>
              <button
                onClick={() => choose('accepted')}
                className="border border-primary bg-primary px-5 py-2 text-[11px] uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Accept all
              </button>
              <button
                onClick={() => choose('declined')}
                className="text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
