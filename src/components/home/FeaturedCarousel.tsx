'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/types'
import type { Locale } from '@/types'

interface FeaturedCarouselProps {
  products: Product[]
  locale: Locale
  title: string
}

const EASE = [0.22, 1, 0.36, 1] as const

export function FeaturedCarousel({ products, locale, title }: FeaturedCarouselProps) {
  const t = useTranslations('home')
  const tCatalog = useTranslations('catalog')
  const reduceMotion = useReducedMotion()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 1 },
    },
  })
  const [paused, setPaused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || paused || reduceMotion) return
    const id = setInterval(() => emblaApi.scrollNext(), 4500)
    return () => clearInterval(id)
  }, [emblaApi, paused, reduceMotion])

  if (!products.length) return null

  const navButton =
    'group flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-foreground transition-all duration-500 ease-lux hover:border-gold hover:bg-gold hover:text-[var(--bg)]'

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="eyebrow">{tCatalog('eyebrow')}</p>
            <h2 className="heading-display mt-5 text-4xl text-foreground md:text-6xl">{title}</h2>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/catalog" className="group hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground sm:flex">
              <span className="link-lux">{t('footerFullCatalog')}</span>
              <ArrowRight size={13} aria-hidden="true" className="text-gold transition-transform duration-500 ease-lux group-hover:translate-x-1" />
            </Link>
            <div className="flex items-center gap-2">
              <button type="button" onClick={scrollPrev} className={navButton} aria-label={t('carouselPrevious')}>
                <ChevronLeft size={16} className="transition-transform duration-500 ease-lux group-hover:-translate-x-0.5" />
              </button>
              <button type="button" onClick={scrollNext} className={navButton} aria-label={t('carouselNext')}>
                <ChevronRight size={16} className="transition-transform duration-500 ease-lux group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div
          className="overflow-hidden"
          ref={emblaRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="flex gap-5 md:gap-7">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="min-w-[260px] flex-[0_0_260px] md:min-w-[300px] md:flex-[0_0_300px] lg:min-w-[280px] lg:flex-[0_0_calc(25%-21px)]"
              >
                {/* Inner wrapper animates so it never fights Embla's own slide transforms */}
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.9, delay: Math.min(i, 4) * 0.08, ease: EASE }}
                  className="h-full"
                >
                  <ProductCard product={product} locale={locale} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          <span className="heading-display w-8 text-right text-lg tabular-nums text-gold">
            {String(selectedIndex + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-current={i === selectedIndex ? 'true' : undefined}
                className="group flex h-6 items-center"
                aria-label={t('carouselSlide', { number: i + 1 })}
              >
                <span
                  className={`block h-px transition-all duration-700 ease-lux ${
                    i === selectedIndex ? 'w-10 bg-gold' : 'w-4 bg-gold/30 group-hover:bg-gold/60'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="heading-display w-8 text-lg tabular-nums text-muted-foreground">
            {String(scrollSnaps.length || 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  )
}
