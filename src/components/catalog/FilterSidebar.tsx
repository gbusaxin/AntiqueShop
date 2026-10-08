'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Slider from '@radix-ui/react-slider'
import { Check, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'

const ERAS = ['Art Deco', 'Art Nouveau', 'Victorian', 'Baroque', '18th century', 'Soviet', 'Other']
const MATERIALS = ['Porcelain', 'Crystal', 'Silver', 'Bronze', 'Copper', 'Glass', 'Wood', 'Ivory']
const CONDITIONS: { value: string; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gold/15 pb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-xs uppercase tracking-[0.18em] text-gold/70 hover:text-gold-rich transition-colors"
      >
        {label}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function CheckItem({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="flex h-4 w-4 shrink-0 items-center justify-center border border-gold/30 bg-transparent transition-colors data-[state=checked]:border-gold data-[state=checked]:bg-gold/15"
      >
        <Checkbox.Indicator>
          <Check size={10} className="text-gold-rich" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label className="cursor-pointer text-xs tracking-wide text-[#c8bfaa]/80 hover:text-[#f4ead1] transition-colors">
        {label}
      </label>
    </div>
  )
}

interface FilterSidebarProps {
  selectedEras: string[]
  selectedMaterials: string[]
  priceMin: number
  priceMax: number
  condition: string
}

export function FilterSidebar({
  selectedEras,
  selectedMaterials,
  priceMin,
  priceMax,
  condition,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([priceMin, priceMax])

  const updateParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const url = new URL(window.location.href)
      url.searchParams.delete(key)
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v))
        } else {
          url.searchParams.set(key, value)
        }
      }
      router.push(`${pathname}?${url.searchParams.toString()}`)
    },
    [router, pathname]
  )

  const toggleEra = (era: string) => {
    const next = selectedEras.includes(era)
      ? selectedEras.filter((e) => e !== era)
      : [...selectedEras, era]
    updateParam('era', next.length ? next : null)
  }

  const toggleMaterial = (mat: string) => {
    const next = selectedMaterials.includes(mat)
      ? selectedMaterials.filter((m) => m !== mat)
      : [...selectedMaterials, mat]
    updateParam('material', next.length ? next : null)
  }

  const setCondition = (value: string) => {
    updateParam('condition', value === condition ? null : value)
  }

  const hasFilters =
    selectedEras.length > 0 ||
    selectedMaterials.length > 0 ||
    !!condition ||
    priceMin > 0 ||
    priceMax < 50000

  const clearAll = () => {
    router.push(pathname)
    setLocalPriceRange([0, 50000])
  }

  const FiltersContent = (
    <div className="flex flex-col gap-0">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="mb-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gold/60 hover:text-gold-rich transition-colors"
        >
          <X size={10} /> Clear all filters
        </button>
      )}

      <FilterGroup label="Era">
        {ERAS.map((era) => (
          <CheckItem
            key={era}
            label={era}
            checked={selectedEras.includes(era)}
            onCheckedChange={() => toggleEra(era)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Material">
        {MATERIALS.map((mat) => (
          <CheckItem
            key={mat}
            label={mat}
            checked={selectedMaterials.includes(mat)}
            onCheckedChange={() => toggleMaterial(mat)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Price (EUR)">
        <div className="px-1 pt-2 pb-4">
          <Slider.Root
            min={0}
            max={50000}
            step={500}
            value={localPriceRange}
            onValueChange={(v) => setLocalPriceRange(v as [number, number])}
            onValueCommit={(v) => {
              const [min, max] = v as [number, number]
              updateParam('priceMin', min > 0 ? String(min) : null)
              updateParam('priceMax', max < 50000 ? String(max) : null)
            }}
            className="relative flex h-4 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-px flex-1 bg-gold/20">
              <Slider.Range className="absolute h-full bg-gold/60" />
            </Slider.Track>
            <Slider.Thumb className="block h-3 w-3 rounded-full border border-gold bg-emerald-dark shadow transition-colors focus:outline-none hover:bg-gold/20" />
            <Slider.Thumb className="block h-3 w-3 rounded-full border border-gold bg-emerald-dark shadow transition-colors focus:outline-none hover:bg-gold/20" />
          </Slider.Root>
          <div className="mt-2 flex justify-between text-[10px] text-gold/50">
            <span>€{localPriceRange[0].toLocaleString()}</span>
            <span>€{localPriceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup label="Condition">
        <div className="flex flex-col gap-0">
          {CONDITIONS.map((c) => (
            <div key={c.value} className="flex items-center gap-2.5 py-1.5">
              <button
                onClick={() => setCondition(c.value)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  condition === c.value
                    ? 'border-gold bg-gold/20'
                    : 'border-gold/30 hover:border-gold/60'
                }`}
                aria-label={c.label}
              >
                {condition === c.value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-gold-rich" />
                )}
              </button>
              <span className="cursor-pointer text-xs tracking-wide text-[#c8bfaa]/80">{c.label}</span>
            </div>
          ))}
        </div>
      </FilterGroup>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="flex items-center gap-2 border border-gold/30 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-gold/70 transition-colors hover:border-gold hover:text-gold-rich lg:hidden"
      >
        <SlidersHorizontal size={14} />
        Filters {hasFilters && (
          <span className="text-gold-rich">
            ({selectedEras.length + selectedMaterials.length + (condition ? 1 : 0)})
          </span>
        )}
      </button>

      {mobileOpen && (
        <div className="rounded border border-gold/15 bg-[#071a12] p-5 lg:hidden">
          {FiltersContent}
        </div>
      )}

      <div className="hidden lg:block">{FiltersContent}</div>
    </>
  )
}
