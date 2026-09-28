'use client'

import { useState } from 'react'
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

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-dark/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Zoom>
              <img
                src={allImages[selected]}
                alt={`${alt} — view ${selected + 1}`}
                className="h-full w-full object-cover"
                width={800}
                height={1000}
              />
            </Zoom>
          </motion.div>
        </AnimatePresence>
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border transition-colors ${
                i === selected ? 'border-gold' : 'border-gold/20 hover:border-gold/50'
              }`}
            >
              <Image src={img} alt={`${alt} thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
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
