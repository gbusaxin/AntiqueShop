'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

interface PhotoGalleryProps {
  images: string[]
  alt: string
}

export function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0)
  const t = useTranslations('product')
  const allImages = images.length ? images : []

  if (!allImages.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-emerald-dark/40">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-gold/20">
          <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 52l12-12 8 8 12-14 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  const activeImage = allImages.at(selected) ?? allImages.at(0) ?? ''

  return (
    <div className="grid min-w-0 gap-3">
      <div className="relative aspect-square max-h-[min(65vh,36rem)] overflow-hidden border border-gold/20 bg-emerald-dark/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 [&_[data-rmiz]]:h-full [&_[data-rmiz]]:w-full [&_[data-rmiz-content]]:h-full [&_[data-rmiz-content]]:w-full"
          >
            <Zoom
              a11yNameButtonZoom={t('galleryZoom')}
              a11yNameButtonUnzoom={t('galleryCloseZoom')}
              zoomImg={{ src: activeImage }}
            >
              <Image
                src={activeImage}
                alt={t('galleryView', { name: alt, number: selected + 1 })}
                className="h-full w-full object-cover"
                width={800}
                height={800}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={selected === 0}
              />
            </Zoom>
          </motion.div>
        </AnimatePresence>
      </div>

      {allImages.length > 1 && (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-2">
          {allImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={t('galleryThumbnail', { number: i + 1 })}
              aria-pressed={i === selected}
              className={`relative h-20 w-20 shrink-0 overflow-hidden border transition-colors ${
                i === selected ? 'border-gold' : 'border-gold/20 hover:border-gold/50'
              }`}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              {i === selected && (
                <div className="absolute inset-0 bg-gold/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
