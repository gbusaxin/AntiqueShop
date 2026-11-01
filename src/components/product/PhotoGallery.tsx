'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ProductLightbox } from './ProductLightbox'

interface PhotoGalleryProps {
  images: string[]
  alt: string
}

export function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const t = useTranslations('product')

  if (!images.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-[#F5F1EA] dark:bg-[#1F1B17]">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-gold/20">
          <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 52l12-12 8 8 12-14 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <>
      <div className="grid min-w-0 gap-4">
        <button
          ref={imageButtonRef}
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t('galleryZoom')}
          className="relative aspect-[4/5] max-h-[min(65vh,36rem)] w-full cursor-zoom-in overflow-hidden border border-gold/20 bg-[#F5F1EA] dark:bg-[#1F1B17]"
        >
          <Image
            src={images.at(selected) ?? images[0]}
            alt={t('galleryView', { name: alt, number: selected + 1 })}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            priority={selected === 0}
          />
        </button>

        {images.length > 1 && (
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={t('galleryThumbnail', { number: i + 1 })}
                aria-pressed={i === selected}
                className={`relative h-20 w-20 shrink-0 overflow-hidden bg-[#F5F1EA] transition-opacity dark:bg-[#1F1B17] ${
                  i === selected ? 'border-2 border-gold' : 'border border-transparent opacity-60 hover:opacity-100'
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
        onSelect={setSelected}
      />
    </>
  )
}
