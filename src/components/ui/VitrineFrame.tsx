'use client'

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'

const MAX_TILT_DEG = 3

/**
 * Museum-vitrine hover: the frame leans a few degrees toward the cursor and a soft light
 * slides across the glass. Mouse only; skipped entirely for reduced-motion users.
 * Styles are written straight to the elements (one rAF per move) — no React re-renders.
 */
export function VitrineFrame({ children, className }: { children: ReactNode; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef(0)

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const frame = frameRef.current
    const glare = glareRef.current
    if (!frame || !glare) return
    const rect = frame.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      frame.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg) rotateY(${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg)`
      // Glare is 70% of the frame wide; centre it on the cursor
      glare.style.transform = `translate(${(x * rect.width - rect.width * 0.35).toFixed(1)}px, ${(y * rect.height - rect.width * 0.35).toFixed(1)}px)`
    })
  }

  function handleLeave() {
    cancelAnimationFrame(rafRef.current)
    if (frameRef.current) frameRef.current.style.transform = ''
  }

  return (
    <div
      ref={frameRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`${className ?? ''} transition-[transform,box-shadow] duration-700 ease-lux`}
    >
      {children}
      <span ref={glareRef} aria-hidden="true" className="vitrine-glare z-[5]" />
    </div>
  )
}
