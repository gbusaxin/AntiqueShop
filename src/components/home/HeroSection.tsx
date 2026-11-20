'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export interface HeroItem {
  src: string
  name: string
  slug: string
}

interface HeroSectionProps {
  title: string
  subtitle: string
  ctaLabel: string
  secondaryLabel: string
  yearsValue: string
  yearsLabel: string
  items?: HeroItem[]
}

const EASE = [0.22, 1, 0.36, 1] as const

/** Circular engraved seal that slowly turns — pure decoration. */
function RotatingSeal() {
  return (
    <div aria-hidden="true" className="relative h-28 w-28 sm:h-32 sm:w-32">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-spin-slow text-gold">
        <defs>
          <path id="seal-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text fontSize="9.5" letterSpacing="3.2" fill="currentColor" className="font-sans uppercase">
          <textPath href="#seal-circle">VintagEmpire · Wien · Est. 1987 ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] flex items-center justify-center rounded-full border border-gold/40 bg-card/80 backdrop-blur-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="currentColor">
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
        </svg>
      </div>
    </div>
  )
}

/** Line-art amphora used when the catalogue has no photographs yet. */
function AmphoraArt() {
  return (
    <svg viewBox="0 0 200 260" fill="none" aria-hidden="true" className="h-2/3 w-2/3 text-muted-foreground">
      <path
        d="M78 20h44M84 20c0 14-6 18-6 30 0 10 10 14 10 22 0 12-34 26-34 74 0 40 22 70 48 82 26-12 48-42 48-82 0-48-34-62-34-74 0-8 10-12 10-22 0-12-6-16-6-30"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M58 92c-22-4-30 14-20 26M142 92c22-4 30 14 20 26" stroke="currentColor" strokeWidth="1.2" />
      <path d="M60 140h80M56 160h88M66 196h68" stroke="currentColor" strokeWidth=".8" strokeDasharray="2 4" />
      <circle cx="100" cy="176" r="10" stroke="currentColor" strokeWidth=".8" />
    </svg>
  )
}

export function HeroSection({
  title,
  subtitle,
  ctaLabel,
  secondaryLabel,
  yearsValue,
  yearsLabel,
  items = [],
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const archY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const medallionY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const words = title.trim().split(/\s+/)
  const [main, secondary] = items

  return (
    <section ref={sectionRef} data-testid="hero-section" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-28 lg:pt-32">
      {/* Atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-[20%] -top-[30%] h-[70rem] w-[70rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.16),transparent)]" />
        <div className="absolute -bottom-[40%] -left-[20%] h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.08),transparent)]" />
        <div className="absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-gold/15 to-transparent lg:block" />
        <div className="absolute inset-y-0 right-[8%] hidden w-px bg-gradient-to-b from-transparent via-gold/15 to-transparent lg:block" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* Copy */}
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative lg:col-span-6">
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="eyebrow"
          >
            VintagEmpire · Est. 1987
          </motion.p>

          <h1
            data-testid="hero-title"
            className="heading-display mt-7 text-[2.75rem] text-foreground sm:text-6xl lg:text-[4.25rem] xl:text-[5.25rem]"
          >
            {words.map((word, i) => {
              const isLast = i === words.length - 1
              return (
                <span key={`${word}-${i}`}>
                  <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
                    <motion.span
                      className={`inline-block ${isLast ? 'text-gilded italic' : ''}`}
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 1.1, delay: 0.15 + i * 0.08, ease: EASE }}
                    >
                      {word}
                    </motion.span>
                  </span>
                  {!isLast && ' '}
                </span>
              )
            })}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.7, ease: EASE }}
            className="mt-9 h-px w-24 origin-left bg-gold/60"
          />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
            className="mt-8 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href="/catalog" className="btn-lux group">
              {ctaLabel}
              <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-500 ease-lux group-hover:translate-x-1" />
            </Link>
            <Link href="/about" className="btn-ghost">
              {secondaryLabel}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-14 flex items-center gap-5 border-t border-gold/15 pt-6"
          >
            <span className="heading-display text-4xl text-gold-rich">{yearsValue}</span>
            <span className="max-w-[10rem] text-[10px] uppercase leading-relaxed tracking-[0.22em] text-muted-foreground">
              {yearsLabel}
            </span>
          </motion.div>
        </motion.div>

        {/* Exhibit */}
        <div className="relative mx-auto w-full max-w-[26rem] lg:col-span-6 lg:max-w-[30rem]">
          <motion.div
            style={{ y: archY }}
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
            className="arch relative aspect-[4/5] overflow-hidden bg-deep shadow-[var(--shadow-lux)]"
          >
            {main ? (
              <motion.div style={{ y: imageY }} className="absolute -inset-y-[8%] inset-x-0">
                <motion.div
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 2.4, delay: 0.3, ease: EASE }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={main.src}
                    alt={main.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 480px"
                    className="object-cover"
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,rgb(var(--gold-rgb)/0.18),transparent_70%)]">
                <AmphoraArt />
              </div>
            )}
            <div aria-hidden="true" className="arch pointer-events-none absolute inset-3 border border-gold/40 mix-blend-luminosity" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
          </motion.div>

          {secondary && (
            <motion.div
              style={{ y: medallionY }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 1.0, ease: EASE }}
              className="absolute -left-6 bottom-16 hidden sm:block lg:-left-14"
            >
              <Link
                href={`/catalog/${secondary.slug}`}
                aria-label={secondary.name}
                className="group relative block h-32 w-32 overflow-hidden rounded-full border-[5px] border-[var(--bg)] bg-deep shadow-[var(--shadow-lux)] lg:h-40 lg:w-40"
              >
                <Image
                  src={secondary.src}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                />
              </Link>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, rotate: -40 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1.4, delay: 1.1, ease: EASE }}
            className="absolute -right-3 -top-6 sm:-right-10"
          >
            <RotatingSeal />
          </motion.div>

          {main && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.4, ease: EASE }}
              className="absolute -bottom-6 right-4 max-w-[15rem] sm:right-8"
            >
              <Link
                href={`/catalog/${main.slug}`}
                data-visual="dynamic"
                className="group flex items-center gap-4 border border-gold/20 bg-card/95 px-4 py-3 shadow-[var(--shadow-lux)] backdrop-blur-sm transition-colors hover:border-gold/50"
              >
                <span className="heading-display text-2xl italic text-gold">№1</span>
                <span className="line-clamp-2 text-[11px] leading-snug tracking-wide text-foreground">
                  <span className="link-lux">{main.name}</span>
                </span>
                <ArrowRight size={12} aria-hidden="true" className="shrink-0 text-gold transition-transform duration-500 ease-lux group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div aria-hidden="true" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
        <span className="relative block h-12 w-px overflow-hidden bg-gold/15">
          <span className="absolute inset-0 animate-scroll-cue bg-gold" />
        </span>
      </div>
    </section>
  )
}
