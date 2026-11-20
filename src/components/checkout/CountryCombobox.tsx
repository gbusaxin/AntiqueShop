'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronsUpDown } from 'lucide-react'

const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
]

const PRIORITY_COUNTRIES = ['AT', 'DE', 'CH', 'FR', 'IT', 'GB', 'US', 'RU', 'BY', 'KZ', 'UA']

interface Props {
  value: string
  onChange: (value: string) => void
  error?: boolean
}

export function CountryCombobox({ value, onChange, error }: Props) {
  const locale = useLocale()
  const t = useTranslations('checkout')
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
    const names = COUNTRY_CODES.map((code) => ({ code, name: displayNames.of(code) || code }))
    const priority = names.filter((country) => PRIORITY_COUNTRIES.includes(country.code))
      .sort((a, b) => PRIORITY_COUNTRIES.indexOf(a.code) - PRIORITY_COUNTRIES.indexOf(b.code))
    const rest = names.filter((country) => !PRIORITY_COUNTRIES.includes(country.code))
      .sort((a, b) => a.name.localeCompare(b.name, locale))
    return [...priority, ...rest]
  }, [locale])

  const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale)
  const filtered = countries.filter((country) =>
    country.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale).includes(normalized) ||
    country.code.toLowerCase().includes(normalized)
  )
  const selected = countries.find((country) => country.code === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open && filtered.length > 0) {
      document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, filtered.length, id, open])

  const select = (code: string) => {
    onChange(code)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={`${id}-input`} className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {t('shippingAddress.country')}
      </label>
      <div className="relative">
        <input
          id={`${id}-input`}
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={open && filtered.length ? `${id}-option-${activeIndex}` : undefined}
          aria-invalid={error || undefined}
          autoComplete="off"
          value={open ? query : selected?.name || ''}
          placeholder={open ? t('country_search') : t('selectCountry')}
          onFocus={() => { setOpen(true); setQuery(''); setActiveIndex(0) }}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true) }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              setQuery('')
              inputRef.current?.blur()
            } else if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex((index) => Math.max(index - 1, 0))
            } else if (event.key === 'Enter' && open && filtered.length) {
              event.preventDefault()
              select(filtered.at(activeIndex)?.code || filtered.at(0)!.code)
            } else if (event.key === 'Tab') {
              setOpen(false)
              setQuery('')
            }
          }}
          className={`field-lux !px-4 !py-3 !pr-10 !text-sm ${error ? '!border-red-600 dark:!border-red-400' : ''}`}
        />
        <ChevronsUpDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
      </div>
      {open && (
        <div id={`${id}-listbox`} role="listbox" aria-label={t('shippingAddress.country')} className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-gold/25 bg-card shadow-[var(--shadow-lux)]">
          {filtered.length ? filtered.map((country, index) => (
            <div
              id={`${id}-option-${index}`}
              key={country.code}
              role="option"
              aria-selected={country.code === value}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(country.code)}
              className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-foreground ${index === activeIndex ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
            >
              <Check aria-hidden="true" className={`h-4 w-4 shrink-0 ${country.code === value ? 'opacity-100' : 'opacity-0'}`} />
              <span className="flex-1">{country.name}</span>
              <span className="text-xs text-muted-foreground">{country.code}</span>
            </div>
          )) : <p className="px-4 py-3 text-sm text-muted-foreground">{t('country_empty')}</p>}
        </div>
      )}
    </div>
  )
}
