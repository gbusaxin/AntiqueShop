'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

const EASE = [0.22, 1, 0.36, 1] as const
const FOUNDED = 1987
// Derived, so the figure never goes stale
const YEARS = new Date().getFullYear() - FOUNDED

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setValue(to)
      return
    }
    const controls = animate(0, to, {
      duration: 2,
      ease: EASE,
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduceMotion, to])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}

export function AboutTeaser() {
  const t = useTranslations('home')
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const panelY = useTransform(scrollYProgress, [0, 1], ['6%', '-6%'])
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 90])

  return (
    <section ref={sectionRef} data-testid="heritage-section" className="relative overflow-hidden bg-deep/60 py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-12 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1, ease: EASE }}
            className="flex flex-col gap-7 lg:col-span-6"
          >
            <p className="eyebrow">{t('heritageEyebrow')}</p>
            <h2 className="heading-display text-4xl text-foreground md:text-6xl">{t('heritageTitle')}</h2>
            <div className="h-px w-16 bg-gold/50" />
            <p className="max-w-xl text-[15px] leading-[1.85] text-muted-foreground first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:text-gold-rich">
              {t('heritageFirst')}
            </p>
            <p className="max-w-xl text-[15px] leading-[1.85] text-muted-foreground">{t('heritageSecond')}</p>
            <div className="pt-3">
              <Link href="/about" className="btn-ghost group">
                {t('heritageLink')}
                <ArrowRight size={14} aria-hidden="true" className="text-gold transition-transform duration-500 ease-lux group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* The wrapper is observed, not the panel: a fully clipped element never counts as "in view" */}
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.3 }}
            className="relative mx-auto w-full max-w-md lg:col-span-5 lg:col-start-8"
          >
            <motion.div
              style={{ y: panelY }}
              variants={{ hidden: { clipPath: 'inset(0% 0% 100% 0%)' }, shown: { clipPath: 'inset(0% 0% 0% 0%)' } }}
              transition={{ duration: 1.4, ease: EASE }}
              className="arch relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#3b2d1d_0%,#1a140e_55%,#0e0b08_100%)] shadow-[var(--shadow-lux)]"
            >
              <motion.svg
                aria-hidden="true"
                style={{ rotate: ringRotate }}
                viewBox="0 0 200 200"
                className="absolute h-[85%] w-[85%] text-[#C4A06A]/25"
                fill="none"
              >
                <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth=".6" />
                <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth=".4" strokeDasharray="1 5" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="4"
                    x2="100"
                    y2="14"
                    stroke="currentColor"
                    strokeWidth=".8"
                    transform={`rotate(${i * 30} 100 100)`}
                  />
                ))}
              </motion.svg>
              <div aria-hidden="true" className="arch pointer-events-none absolute inset-3 border border-[#C4A06A]/35" />
              <p className="relative text-[10px] uppercase tracking-[0.5em] text-[#DEC08C]/80">Wien</p>
              <p className="heading-display relative mt-3 text-7xl italic text-[#DEC08C] md:text-8xl">{FOUNDED}</p>
              <svg aria-hidden="true" viewBox="0 0 120 12" className="relative mt-5 w-28 text-[#C4A06A]/70" fill="none">
                <path d="M0 6h48M72 6h48" stroke="currentColor" strokeWidth=".8" />
                <path d="M60 1l5 5-5 5-5-5z" fill="currentColor" />
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
              className="absolute -bottom-8 -left-4 border border-gold/25 bg-card px-7 py-5 shadow-[var(--shadow-lux)] sm:-left-10"
            >
              <p className="heading-display text-5xl text-gold-rich">
                <CountUp to={YEARS} suffix="+" />
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t('heritageYears')}</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
