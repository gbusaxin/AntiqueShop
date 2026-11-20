'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useRegionStore } from '@/store/regionStore'
import { REGION_CURRENCIES } from '@/lib/region'
import type { Region } from '@/types'

const REGIONS: { value: Region; currency: string; flag: string }[] = [
  { value: 'EU', currency: REGION_CURRENCIES.EU, flag: '🇪🇺' },
  { value: 'UK', currency: REGION_CURRENCIES.UK, flag: '🇬🇧' },
  { value: 'US', currency: REGION_CURRENCIES.US, flag: '🇺🇸' },
  { value: 'CIS', currency: REGION_CURRENCIES.CIS, flag: '🇷🇺' },
  { value: 'OTHER', currency: REGION_CURRENCIES.OTHER, flag: '🌐' },
]

export function Footer() {
  const { region, setRegion } = useRegionStore()
  const currency = region === 'EU' ? REGION_CURRENCIES.EU
    : region === 'UK' ? REGION_CURRENCIES.UK
    : region === 'US' ? REGION_CURRENCIES.US
    : region === 'CIS' ? REGION_CURRENCIES.CIS
    : region === 'OTHER' ? REGION_CURRENCIES.OTHER
    : undefined
  const t = useTranslations('home')
  const tNav = useTranslations('nav')
  const tLegal = useTranslations('legal')
  const tRegion = useTranslations('region')

  const linkClass = 'link-lux text-foreground/80 transition-colors hover:text-foreground'

  return (
    <footer data-testid="site-footer" className="relative overflow-hidden border-t border-gold/15 bg-deep text-muted-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.12),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl font-medium tracking-wide text-foreground">
              Vintag<span className="italic text-gold">Empire</span>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              {t('footerDescription')}
            </p>
            <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-8 bg-gold/50" />
              Wien · Est. 1987
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="mb-5 text-[11px] uppercase tracking-[0.24em] text-gold">{t('footerCollection')}</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/catalog" className={linkClass}>{t('footerFullCatalog')}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="mb-5 text-[11px] uppercase tracking-[0.24em] text-gold">{t('footerInformation')}</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className={linkClass}>{t('footerAbout')}</Link></li>
              <li><Link href="/contacts" className={linkClass}>{tNav('contacts')}</Link></li>
              <li><a href="mailto:gbusaxin@gmail.com" className={`break-all ${linkClass}`}>gbusaxin@gmail.com</a></li>
              <li><Link href="/legal/privacy" className={linkClass}>{tLegal('privacy.title')}</Link></li>
              <li><Link href="/legal/offer" className={linkClass}>{tLegal('offer.title')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-gold/15 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p data-visual="dynamic" className="text-xs tracking-wide">
            © {new Date().getFullYear()} VintagEmpire. {t('footerRights')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em]">{t('footerRegion')}</span>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="cursor-pointer appearance-none border border-gold/30 bg-card py-1.5 pl-3 pr-8 text-xs tracking-wide text-foreground transition-colors hover:border-gold/60 focus:border-gold focus:outline-none"
                aria-label={t('footerRegion')}
              >
                {REGIONS.map(({ value, currency, flag }) => (
                  <option key={value} value={value} className="bg-card text-foreground">
                    {flag} {tRegion(value)} / {currency}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-gold">▼</span>
            </div>
            <span className="text-xs text-gold">{currency}</span>
          </div>
        </div>

        {/* Oversized engraved wordmark */}
        <p
          aria-hidden="true"
          className="heading-display pointer-events-none -mb-[0.22em] select-none whitespace-nowrap text-center text-[15vw] leading-none text-transparent [-webkit-text-stroke:1px_rgb(var(--gold-rgb)/0.28)] lg:text-[13.5rem]"
        >
          VintagEmpire
        </p>
      </div>
    </footer>
  )
}
