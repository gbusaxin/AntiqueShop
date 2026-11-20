'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Category } from '@/types'
import type { Locale } from '@/types'

interface CategoriesGridProps {
  categories: Category[]
  locale: Locale
  title: string
}

const EASE = [0.22, 1, 0.36, 1] as const

/** Engraved lattice for categories without a photograph: a dark velvet display-case look. */
const LATTICE =
  "url(\"data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 0l24 24-24 24L0 24z' fill='none' stroke='%23C4A06A' stroke-opacity='.14'/%3E%3Ccircle cx='24' cy='24' r='2' fill='%23C4A06A' fill-opacity='.18'/%3E%3C/svg%3E\")"

export function CategoriesGrid({ categories, locale, title }: CategoriesGridProps) {
  const t = useTranslations('home')

  if (!categories.length) return null

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="eyebrow">VintagEmpire</p>
            <h2 className="heading-display mt-5 text-4xl text-foreground md:text-6xl">{title}</h2>
          </div>
          <Link href="/catalog" className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground">
            <span className="link-lux">{t('footerFullCatalog')}</span>
            <ArrowRight size={13} aria-hidden="true" className="text-gold transition-transform duration-500 ease-lux group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[17rem] lg:grid-cols-4">
          {categories.map((cat, i) => {
            const record = cat as unknown as Record<string, string | null | undefined>
            const name = getLocalizedField(record, 'name', locale)
            const description = getLocalizedField(record, 'description', locale)
            const featured = i === 0

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.9, delay: (i % 4) * 0.08, ease: EASE }}
                className={featured ? 'col-span-2 lg:row-span-2' : ''}
              >
                <Link
                  href={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                  className={`group relative flex h-full items-end overflow-hidden bg-[#1a140e] ${
                    featured ? 'aspect-[2/1] lg:aspect-auto' : 'aspect-square lg:aspect-auto'
                  }`}
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={name}
                      fill
                      sizes={featured ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                      className="object-cover transition-transform duration-[1400ms] ease-lux group-hover:scale-[1.08]"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(140deg,#3b2d1d_0%,#1a140e_55%,#0e0b08_100%)] transition-transform duration-[1400ms] ease-lux group-hover:scale-[1.08]"
                    >
                      <div className="absolute inset-0" style={{ backgroundImage: LATTICE }} />
                      <span className="heading-display absolute -right-2 -top-6 select-none text-[9rem] italic leading-none text-[#C4A06A]/10 lg:text-[12rem]">
                        {name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-[#C4A06A]/0 transition-all duration-700 ease-lux group-hover:inset-4 group-hover:border-[#C4A06A]/45" />

                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-4 flex h-9 w-9 -translate-y-2 items-center justify-center rounded-full border border-white/30 text-white opacity-0 backdrop-blur-sm transition-all duration-500 ease-lux group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <ArrowUpRight size={15} />
                  </span>

                  <div className="relative z-10 w-full p-5 sm:p-6">
                    <p className="text-[10px] tracking-[0.3em] text-[#DEC08C]">{String(i + 1).padStart(2, '0')}</p>
                    <p
                      className={`heading-display mt-2 text-[#F6F1E8] transition-transform duration-700 ease-lux group-hover:-translate-y-1 ${
                        featured ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {name}
                    </p>
                    {featured && description && (
                      <p className="mt-3 line-clamp-2 max-w-md text-sm leading-relaxed text-[#F6F1E8]/75">
                        {description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
