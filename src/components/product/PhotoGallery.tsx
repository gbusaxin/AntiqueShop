'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ProductLightbox } from './ProductLightbox'

const LOUPE_SIZE = 184
const LOUPE_ZOOM = 2.6

interface PhotoGalleryProps {
  images: string[]
  alt: string
  /** Links the main photo to the product card photo for the page transition */
  productId?: string
}

export function PhotoGallery({ images, alt, productId }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0)
  // Crossfade only when the visitor switches photos — the first photo arrives via the page transition
  const [switched, setSwitched] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const loupeRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  // The hi-res lens image is only requested once someone actually hovers the photo
  const [loupeArmed, setLoupeArmed] = useState(false)
  const t = useTranslations('product')

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  /** Jeweller's loupe: a magnified window that follows the mouse (touch keeps tap-to-lightbox). */
  function moveLoupe(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse') return
    const button = imageButtonRef.current
    const loupe = loupeRef.current
    const lens = lensRef.current
    if (!button || !loupe || !lens) return
    if (!loupeArmed) setLoupeArmed(true)
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const half = LOUPE_SIZE / 2
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      lens.style.width = `${rect.width}px`
      lens.style.height = `${rect.height}px`
      loupe.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`
      lens.style.transform = `translate3d(${half - x * LOUPE_ZOOM}px, ${half - y * LOUPE_ZOOM}px, 0) scale(${LOUPE_ZOOM})`
      button.dataset.loupe = 'on'
    })
  }

  function hideLoupe() {
    cancelAnimationFrame(rafRef.current)
    if (imageButtonRef.current) delete imageButtonRef.current.dataset.loupe
  }

  if (!images.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-deep">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="text-gold/40">
          <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 52l12-12 8 8 12-14 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row-reverse lg:items-start">
        <button
          ref={imageButtonRef}
          type="button"
          data-vt-photo={productId}
          data-vt-primary={productId ? '' : undefined}
          onClick={() => setLightboxOpen(true)}
          onPointerMove={moveLoupe}
          onPointerLeave={hideLoupe}
          aria-label={t('galleryZoom')}
          className="group frame-gilt relative aspect-[4/5] max-h-[min(72vh,42rem)] w-full min-w-0 flex-1 cursor-zoom-in overflow-hidden bg-deep [@media(hover:hover)_and_(pointer:fine)]:data-[loupe=on]:cursor-none"
        >
          <Image
            key={selected}
            src={images.at(selected) ?? images[0]}
            alt={t('galleryView', { name: alt, number: selected + 1 })}
            fill
            // Real width on phones is the screen minus page padding and the frame's inset
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 90vw, 55vw"
            className={`object-contain p-6 ${switched ? 'animate-fade-in' : ''}`}
            priority={selected === 0}
            // The first photo is the page's LCP element: fetch it ahead of scripts and other images
            fetchPriority={selected === 0 ? 'high' : 'auto'}
          />
          <div
            ref={loupeRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 hidden [@media(hover:hover)_and_(pointer:fine)]:block"
            style={{ width: LOUPE_SIZE, height: LOUPE_SIZE }}
          >
            <div className="h-full w-full scale-90 overflow-hidden rounded-full bg-deep opacity-0 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(var(--gold-rgb)/0.9),0_0_0_5px_rgb(var(--gold-rgb)/0.18)] transition-[transform,opacity] duration-200 ease-lux group-data-[loupe=on]:scale-100 group-data-[loupe=on]:opacity-100 motion-reduce:scale-100">
              <div ref={lensRef} className="relative origin-top-left">
                {loupeArmed && (
                  <Image
                    src={images.at(selected) ?? images[0]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 260vw, 130vw"
                    className="object-contain p-6"
                  />
                )}
              </div>
            </div>
          </div>
        </button>

        {images.length > 1 && (
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 lg:max-h-[min(72vh,42rem)] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSwitched(true)
                  setSelected(i)
                }}
                aria-label={t('galleryThumbnail', { number: i + 1 })}
                aria-pressed={i === selected}
                className={`relative h-20 w-20 shrink-0 overflow-hidden bg-deep transition-[opacity,outline-color] duration-500 ease-lux ${
                  i === selected ? 'outline outline-1 outline-offset-2 outline-gold' : 'opacity-55 hover:opacity-100'
                }`}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            ))}
          </div>
        )}
      </div>
      <ProductLightbox
        images={images}
        initialIndex={selected}
        alt={alt}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        triggerRef={imageButtonRef}
        onSelect={(index) => {
          setSwitched(true)
          setSelected(index)
        }}
      />
    </>
  )
}
