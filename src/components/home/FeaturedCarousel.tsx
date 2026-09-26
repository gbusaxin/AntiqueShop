'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/types'
import type { Locale } from '@/types'

interface FeaturedCarouselProps {
  products: Product[]
  locale: Locale
  title: string
}

export function FeaturedCarousel({ products, locale, title }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 1 },
    },
  })
  const [hovering, setHovering] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || hovering) return
    const id = setInterval(() => emblaApi.scrollNext(), 3500)
    return () => clearInterval(id)
  }, [emblaApi, hovering])

  if (!products.length) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-serif text-3xl text-gold-rich md:text-4xl">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="flex h-9 w-9 items-center justify-center border border-gold/30 text-gold/60 transition-colors hover:border-gold hover:text-gold-rich"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={scrollNext}
              className="flex h-9 w-9 items-center justify-center border border-gold/30 text-gold/60 transition-colors hover:border-gold hover:text-gold-rich"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden"
          ref={emblaRef}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="flex gap-4 md:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="min-w-[260px] flex-[0_0_260px] md:min-w-[300px] md:flex-[0_0_300px] lg:min-w-[280px] lg:flex-[0_0_calc(25%-18px)]"
              >
                <ProductCard product={product} locale={locale} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === selectedIndex ? 'w-6 bg-gold-rich' : 'w-2 bg-gold/30'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
