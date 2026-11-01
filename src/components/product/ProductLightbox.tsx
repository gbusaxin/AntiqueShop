'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ProductLightboxProps {
  images: string[]
  initialIndex: number
  alt: string
  open: boolean
  onClose: () => void
  onSelect: (index: number) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function ProductLightbox({ images, initialIndex, alt, open, onClose, onSelect, triggerRef }: ProductLightboxProps) {
  const t = useTranslations('product')
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1, startIndex: initialIndex })

  const close = useCallback(() => {
    onSelect(selectedIndex)
    onClose()
  }, [onClose, onSelect, selectedIndex])

  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [open])

  useEffect(() => {
    if (!emblaApi || !open) return
    emblaApi.scrollTo(initialIndex, true)
    const updateSelectedIndex = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    updateSelectedIndex()
    emblaApi.on('select', updateSelectedIndex)
    return () => { emblaApi.off('select', updateSelectedIndex) }
  }, [emblaApi, initialIndex, open])

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close() }}>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] bg-black/95"
                />
              </Dialog.Overlay>
              <Dialog.Content
                asChild
                aria-describedby={undefined}
                onCloseAutoFocus={(event) => {
                  event.preventDefault()
                  triggerRef.current?.focus()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') {
                    event.preventDefault()
                    emblaApi?.scrollPrev()
                  } else if (event.key === 'ArrowRight') {
                    event.preventDefault()
                    emblaApi?.scrollNext()
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(event) => { if (event.target === event.currentTarget) close() }}
                  className="fixed inset-0 z-[101] text-white"
                >
                  <Dialog.Title className="sr-only">{t('gallery')}</Dialog.Title>
                  <div className="absolute left-4 top-4 text-sm text-white/80" aria-live="polite">
                    {selectedIndex + 1} / {images.length}
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label={t('galleryCloseZoom')}
                      className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X size={24} />
                    </button>
                  </Dialog.Close>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label={t('galleryPrevious')}
                        onClick={() => emblaApi?.scrollPrev()}
                        className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 sm:left-4"
                      >
                        <ChevronLeft size={28} />
                      </button>
                      <button
                        type="button"
                        aria-label={t('galleryNext')}
                        onClick={() => emblaApi?.scrollNext()}
                        className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 sm:right-4"
                      >
                        <ChevronRight size={28} />
                      </button>
                    </>
                  )}

                  <div className="absolute inset-x-12 bottom-20 top-16 overflow-hidden sm:inset-x-20" ref={emblaRef}>
                    <div className="flex h-full touch-pan-y">
                      {images.map((image, index) => (
                        <div key={index} className="relative h-full min-w-0 flex-[0_0_100%]">
                          <Image
                            src={image}
                            alt={t('galleryView', { name: alt, number: index + 1 })}
                            fill
                            sizes="100vw"
                            className="object-contain"
                            priority={index === selectedIndex}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="absolute inset-x-12 bottom-5 z-10 flex max-h-10 justify-center gap-2 overflow-x-auto sm:inset-x-20">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => emblaApi?.scrollTo(index)}
                          aria-label={t('galleryThumbnail', { number: index + 1 })}
                          aria-current={selectedIndex === index ? 'true' : undefined}
                          className={`h-3 shrink-0 rounded-full transition-all ${selectedIndex === index ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
