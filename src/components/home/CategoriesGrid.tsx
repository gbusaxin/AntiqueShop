'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Category } from '@/types'
import type { Locale } from '@/types'

const PLACEHOLDER_GRADIENTS = [
  'from-[#1a4a3a] to-[#0d2e24]',
  'from-[#3d1a1a] to-[#1a0a0a]',
  'from-[#2a3a1a] to-[#1a2a0d]',
  'from-[#1a2a4a] to-[#0d1a2e]',
  'from-[#3a2a1a] to-[#2a1a0d]',
  'from-[#1a3a3a] to-[#0d2a2a]',
  'from-[#3a1a3a] to-[#2a0d2a]',
  'from-[#2a3a2a] to-[#1a2a1a]',
]

interface CategoriesGridProps {
  categories: Category[]
  locale: Locale
  title: string
}

export function CategoriesGrid({ categories, locale, title }: CategoriesGridProps) {
  return (
    <section className="py-20" style={{ background: 'rgba(3,55,40,0.06)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-serif text-3xl text-gold-rich md:text-4xl">{title}</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-gold/40" />
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {categories.map((cat, i) => {
            const name = getLocalizedField(
              cat as unknown as Record<string, string | null | undefined>,
              'name',
              locale
            )
            const gradient = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.1 }}
              >
                <Link
                  href={`/catalog?category=${cat.slug}`}
                  className="group relative flex aspect-square items-end overflow-hidden"
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 group-hover:opacity-80`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-dark/80 via-emerald-dark/20 to-transparent transition-all duration-300 group-hover:from-emerald-dark/60" />
                  <div className="relative z-10 w-full p-4">
                    <p className="font-serif text-base tracking-wide text-[#f4ead1] transition-transform duration-300 group-hover:scale-105 group-hover:text-gold-rich sm:text-lg">
                      {name}
                    </p>
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
