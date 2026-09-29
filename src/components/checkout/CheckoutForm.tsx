'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useRegionStore } from '@/store/regionStore'
import { getPaymentMethodsForRegion } from '@/lib/getPaymentProvidersForRegion'
import { formatPrice } from '@/lib/getPriceForRegion'
import { getRegionFromCountryCode } from '@/lib/region'
import type { Locale } from '@/types'

const COUNTRIES = [
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' }, { code: 'AT', name: 'Austria' }, { code: 'CH', name: 'Switzerland' },
  { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' }, { code: 'PL', name: 'Poland' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' }, { code: 'RU', name: 'Russia' }, { code: 'BY', name: 'Belarus' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'UA', name: 'Ukraine' }, { code: 'OTHER', name: 'Other' },
]

const STATE_COUNTRIES = ['US', 'CA', 'AU']

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Required'),
  country: z.string().min(1, 'Required'),
  addressLine1: z.string().min(1, 'Required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  deliveryMethod: z.enum(['standard', 'express']),
  paymentMethodId: z.string().min(1, 'Select a payment method'),
})

type FormData = z.infer<typeof schema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[10px] text-red-400">{message}</p>
}

function InputField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">{label}</label>
      <input
        {...props}
        className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/25 focus:border-gold/60 focus:outline-none"
      />
      <FieldError message={error} />
    </div>
  )
}

interface CheckoutFormProps {
  locale: Locale
}

export function CheckoutForm({ locale }: CheckoutFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { items, totalEur, clearCart } = useCartStore()
  const { region: storeRegion } = useRegionStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryMethod: 'standard' },
  })

  const watchedCountry = watch('country')
  const derivedRegion = watchedCountry ? getRegionFromCountryCode(watchedCountry) : storeRegion
  const paymentMethods = getPaymentMethodsForRegion(derivedRegion)
  const showState = STATE_COUNTRIES.includes(watchedCountry)

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  const deliveryMethod = watch('deliveryMethod')
  const shippingCost = deliveryMethod === 'express' ? 75 : 35

  const step1Fields: (keyof FormData)[] = [
    'firstName', 'lastName', 'email', 'phone',
    'country', 'addressLine1', 'city', 'deliveryMethod',
  ]

  const goToStep2 = async () => {
    const valid = await trigger(step1Fields)
    if (valid) setStep(2)
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    const provider = derivedRegion === 'CIS' ? 'yookassa' : 'stripe'
    try {
      const res = await fetch(`/api/checkout/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, priceEur: i.priceEur })),
          shippingAddress: {
            country: data.country,
            city: data.city,
            address_line_1: data.addressLine1,
            address_line_2: data.addressLine2,
            postal_code: data.postalCode,
            state: data.state,
            recipient_name: `${data.firstName} ${data.lastName}`,
            recipient_phone: data.phone,
          },
          email: data.email,
          paymentMethodId: data.paymentMethodId,
          deliveryMethod: data.deliveryMethod,
          region: derivedRegion,
          locale,
        }),
      })

      const json = await res.json()

      if (json.url) {
        clearCart()
        window.location.href = json.url
      } else if (json.orderId) {
        clearCart()
        router.push(`/checkout/success?orderId=${json.orderId}`)
      }
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-8 flex items-center gap-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center border text-[11px] font-medium transition-colors ${
                  s === step
                    ? 'border-gold bg-gold/10 text-gold-rich'
                    : s < step
                    ? 'border-gold/60 bg-gold/5 text-gold/70'
                    : 'border-gold/20 text-gold/30'
                }`}
              >
                {s}
              </div>
              <span className={`text-[10px] uppercase tracking-[0.15em] ${s === step ? 'text-gold/80' : 'text-gold/30'}`}>
                {s === 1 ? 'Shipping' : 'Payment'}
              </span>
              {s < 2 && <div className="h-px w-8 bg-gold/15" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InputField label="First Name" error={errors.firstName?.message} {...register('firstName')} />
                <InputField label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
                <InputField label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <InputField label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">Country</label>
                <select
                  {...register('country')}
                  className="w-full border border-gold/25 bg-[#0a1f18] px-4 py-3 text-xs text-[#f4ead1] focus:border-gold/60 focus:outline-none"
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0a1f18]">{c.name}</option>
                  ))}
                </select>
                <FieldError message={errors.country?.message} />
              </div>

              <InputField label="Address Line 1" error={errors.addressLine1?.message} {...register('addressLine1')} />
              <InputField label="Address Line 2 (optional)" {...register('addressLine2')} />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InputField label="City" error={errors.city?.message} {...register('city')} />
                {showState && (
                  <InputField label="State / Region" {...register('state')} />
                )}
                <InputField label="Postal Code" {...register('postalCode')} />
              </div>

              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-gold/60">Delivery Method</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { value: 'standard', label: 'Standard Delivery', price: '€35', time: '7–14 days' },
                    { value: 'express', label: 'Express Delivery', price: '€75', time: '2–5 days' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-1 border p-4 transition-colors ${
                        deliveryMethod === opt.value
                          ? 'border-gold/60 bg-gold/5'
                          : 'border-gold/20 hover:border-gold/35'
                      }`}
                    >
                      <input type="radio" value={opt.value} {...register('deliveryMethod')} className="sr-only" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#f4ead1]">{opt.label}</span>
                        <span className="font-serif text-sm text-gold-rich">{opt.price}</span>
                      </div>
                      <span className="text-[10px] text-gold/50">{opt.time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={goToStep2}
                className="mt-2 flex items-center justify-center border border-gold/40 bg-gold/10 py-4 text-xs uppercase tracking-[0.2em] text-gold-rich transition-colors hover:bg-gold/20"
              >
                Continue to Payment →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="mb-4 text-[10px] uppercase tracking-[0.15em] text-gold/60">Payment Method</p>
                {derivedRegion === 'CIS' && (
                  <p className="mb-3 text-[10px] text-gold/40">
                    Оплата через ЮKassa — доступна для России и СНГ
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className="flex cursor-pointer items-center gap-3 border border-gold/20 p-4 transition-colors hover:border-gold/40"
                    >
                      <input
                        type="radio"
                        value={method.id}
                        {...register('paymentMethodId')}
                        className="sr-only"
                      />
                      <div className="h-4 w-4 shrink-0 rounded-full border border-gold/40 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-gold-rich opacity-0 peer-checked:opacity-100" />
                      </div>
                      <span className="text-xs text-[#c8bfaa]/80">{method.label[locale]}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.paymentMethodId?.message} />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-gold/20 px-6 py-4 text-xs uppercase tracking-[0.15em] text-gold/50 transition-colors hover:border-gold/40 hover:text-gold/80"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 border border-gold bg-gold/10 py-4 text-xs uppercase tracking-[0.2em] text-gold-rich transition-all hover:bg-gold hover:text-emerald-dark disabled:opacity-50"
                >
                  {submitting ? 'Processing…' : 'Place Order'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:sticky lg:top-24 h-fit">
        <div className="border border-gold/15 p-6">
          <p className="mb-5 font-serif text-base text-gold-rich">Order Summary</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.product.images?.[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt=""
                      width={32}
                      height={40}
                      className="h-10 w-8 object-cover opacity-80"
                    />
                  )}
                  <div>
                    <p className="text-[10px] text-[#c8bfaa]/70 line-clamp-1">
                      {item.product.name_en ?? item.product.name_ru ?? 'Item'}
                    </p>
                    <p className="text-[10px] text-gold/50">×{item.quantity}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-[#f4ead1]">
                  {formatPrice(item.priceEur * item.quantity, 'EUR', localeStr)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-gold/10 pt-4 text-xs">
            <div className="flex justify-between text-[#c8bfaa]/60">
              <span>Subtotal</span>
              <span>{formatPrice(totalEur, 'EUR', localeStr)}</span>
            </div>
            <div className="flex justify-between text-[#c8bfaa]/60">
              <span>Shipping</span>
              <span>{formatPrice(shippingCost, 'EUR', localeStr)}</span>
            </div>
            <div className="flex justify-between border-t border-gold/10 pt-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-gold/70">Total</span>
              <span className="font-serif text-base text-gold-rich">
                {formatPrice(totalEur + shippingCost, 'EUR', localeStr)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
