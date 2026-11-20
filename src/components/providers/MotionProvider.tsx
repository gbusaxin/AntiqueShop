'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/** Respect the OS "reduce motion" setting for every framer-motion animation on the storefront. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
