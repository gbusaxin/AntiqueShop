'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useRegionStore } from '@/store/regionStore'
import { REGION_CURRENCIES } from '@/lib/region'
import type { Region } from '@/types'

const REGIONS: { value: Region; label: string; flag: string }[] = [
  { value: 'EU', label: 'EU / EUR', flag: '🇪🇺' },
  { value: 'UK', label: 'UK / GBP', flag: '🇬🇧' },
  { value: 'US', label: 'US / USD', flag: '🇺🇸' },
  { value: 'CIS', label: 'СНГ / RUB', flag: '🇷🇺' },
  { value: 'OTHER', label: 'Other / EUR', flag: '🌐' },
]

export function Footer() {
  const { region, setRegion } = useRegionStore()
  const t = useTranslations('home')
  const tNav = useTranslations('nav')
  const tLegal = useTranslations('legal')
  const tRegion = useTranslations('region')

  return (
    <footer className="border-t border-gold/15 bg-emerald-dark text-gold/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <p className="font-serif text-lg text-gold-rich tracking-wider">Belle Époque</p>
            <p className="mt-3 text-xs leading-relaxed tracking-wide">
              {t('footerDescription')}
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-gold/80">{t('footerCollection')}</p>
            <ul className="space-y-3 text-xs">
              <li><Link href="/catalog" className="hover:text-gold-rich transition-colors">{t('footerFullCatalog')}</Link></li>
              <li><Link href="/catalog?era=Art+Deco" className="hover:text-gold-rich transition-colors">Art Deco</Link></li>
              <li><Link href="/catalog?era=Victorian" className="hover:text-gold-rich transition-colors">Victorian</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-gold/80">{t('footerInformation')}</p>
            <ul className="space-y-3 text-xs">
              <li><Link href="/about" className="hover:text-gold-rich transition-colors">{t('footerAbout')}</Link></li>
              <li><Link href="/contacts" className="hover:text-gold-rich transition-colors">{tNav('contacts')}</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-gold-rich transition-colors">{tLegal('privacy.title')}</Link></li>
              <li><Link href="/legal/offer" className="hover:text-gold-rich transition-colors">{tLegal('offer.title')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gold/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] tracking-wide">
            © {new Date().getFullYear()} Belle Époque. {t('footerRights')}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-gold/40">{t('footerRegion')}</span>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="appearance-none border border-gold/20 bg-transparent py-1.5 pl-3 pr-7 text-[11px] tracking-wide text-gold/70 focus:border-gold/50 focus:outline-none cursor-pointer"
                aria-label={t('footerRegion')}
              >
                {REGIONS.map(({ value, label, flag }) => (
                  <option key={value} value={value} className="bg-[#0a1714] text-[#f4ead1]">
                    {flag} {value === 'CIS' ? `${tRegion('CIS')} / RUB` : value === 'OTHER' ? `${tRegion('OTHER')} / EUR` : label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-gold/40">▼</span>
            </div>
            <span className="text-[10px] text-gold/30">{REGION_CURRENCIES[region]}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
