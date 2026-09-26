import { getTranslations } from 'next-intl/server'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Belle Époque',
  description: 'Curating exceptional antique objects since 1987. Our story, our values, our team.',
}

const MILESTONES = [
  { year: '1987', text: 'Founded in Vienna by Eduard Marchetti, a passionate collector of imperial Russian porcelain.' },
  { year: '1994', text: 'Opened our first gallery on Kärntner Ring, establishing partnerships with major European auction houses.' },
  { year: '2003', text: 'Expanded to Berlin, introducing a dedicated department for Art Nouveau silverware and crystal.' },
  { year: '2012', text: 'Launched our authenticated provenance program, ensuring rigorous documentation for every acquisition.' },
  { year: '2021', text: 'Established our online catalogue, bringing exceptional pieces to collectors worldwide.' },
]

export default async function AboutPage() {
  const t = await getTranslations('about')

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <section
        className="relative flex items-center justify-center py-32"
        style={{ background: 'linear-gradient(135deg, #033728 0%, #3d0f0f 100%)' }}
      >
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Our Heritage</p>
          <h1 className="mt-4 font-serif text-4xl text-gold-rich md:text-5xl">{t('title')}</h1>
          <div className="mx-auto mt-6 h-px w-12 bg-gold/40" />
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-[#c8bfaa]/70">
            {t('mission')}
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold/50">Our Philosophy</p>
              <h2 className="mt-4 font-serif text-2xl text-gold-rich">Objects with Soul</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#c8bfaa]/70">
                <p>
                  We believe that every authentic antique carries within it the accumulated weight of history —
                  the hands that crafted it, the families that treasured it, the generations through which
                  it has passed. Our role is to honour that history and to find each piece its rightful next home.
                </p>
                <p>
                  Every object in our collection undergoes rigorous authentication, including archival research,
                  materials analysis, and consultation with specialist scholars when required. We provide
                  complete provenance documentation with each acquisition.
                </p>
                <p>
                  We work exclusively with objects in exceptional condition, or where any restoration
                  has been performed by acknowledged master conservators using period-appropriate techniques.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="grid grid-cols-2 gap-px bg-gold/10">
                {[
                  { num: '35+', label: 'Years of Expertise' },
                  { num: '4,000+', label: 'Objects Authenticated' },
                  { num: '60+', label: 'Countries Served' },
                  { num: '12', label: 'Specialist Consultants' },
                ].map(({ num, label }) => (
                  <div key={label} className="bg-[#0a1f18] p-8 text-center">
                    <p className="font-serif text-3xl text-gold-rich">{num}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-gold/60">{label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 py-24" style={{ background: 'rgba(3,55,40,0.05)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-14 text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold/50">Chronology</p>
            <h2 className="mt-4 font-serif text-2xl text-gold-rich">{t('history')}</h2>
          </AnimatedSection>

          <div className="relative">
            <div className="absolute left-[23px] top-0 h-full w-px bg-gold/15 sm:left-1/2" />
            <div className="flex flex-col gap-10">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className={`relative flex gap-8 ${i % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
                  <div className="flex-1 sm:text-right">
                    {i % 2 === 0 && (
                      <div className="max-w-xs sm:ml-auto">
                        <p className="font-serif text-xl text-gold-rich">{m.year}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[#c8bfaa]/65">{m.text}</p>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center border border-gold/30 bg-[#0a1f18]">
                    <div className="h-2 w-2 bg-gold/60" />
                  </div>
                  <div className="flex-1">
                    {i % 2 === 1 && (
                      <div className="max-w-xs">
                        <p className="font-serif text-xl text-gold-rich">{m.year}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[#c8bfaa]/65">{m.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
