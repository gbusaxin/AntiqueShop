'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#14110F] text-[#EDEDED] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <p className="text-6xl mb-6 text-[#A67C52]">500</p>
          <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
          <p className="text-[#B5B5B5] mb-8 text-sm leading-relaxed">
            An unexpected error occurred. We have been notified and are working to resolve it.
          </p>
          <button
            onClick={reset}
            className="inline-block border border-[#A67C52] px-8 py-3 text-xs uppercase tracking-[0.18em] text-[#A67C52] transition-colors hover:bg-[#A67C52] hover:text-[#14110F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67C52]"
          >
            Try Again
          </button>
        </motion.div>
      </body>
    </html>
  )
}
