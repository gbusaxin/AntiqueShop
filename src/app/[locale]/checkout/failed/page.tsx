'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { XCircle } from 'lucide-react'

export default function CheckoutFailedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <XCircle size={64} className="text-red-400" strokeWidth={1.5} />
        </motion.div>

        <h1 className="mb-4 font-serif text-3xl text-[var(--fg)]">Payment Failed</h1>
        <p className="mb-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Your payment could not be processed. No charges were made.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          Please check your payment details and try again, or contact your bank if the problem persists.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/checkout"
            className="inline-block border border-[var(--accent)] px-8 py-3 text-xs uppercase tracking-[0.18em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Try Again
          </Link>
          <Link
            href="/cart"
            className="px-8 py-3 text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Back to Cart
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[var(--fg-muted)]">
          Need help?{' '}
          <Link
            href="/contacts"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Contact us
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
