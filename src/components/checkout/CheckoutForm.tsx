'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
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
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale } from '@/types'

const COUNTRIES = [
  'DE', 'FR', 'IT', 'ES', 'AT', 'CH', 'NL', 'BE', 'PL',
  'GB', 'US', 'CA', 'AU', 'RU', 'BY', 'KZ', 'UA', 'OTHER',
] as const

const STATE_COUNTRIES = ['US', 'CA', 'AU']

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
      <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</label>
      <input
        {...props}
        className="w-full border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <FieldError message={error} />
    </div>
  )
}

interface CheckoutFormProps {
  locale: Locale
}

export function CheckoutForm({ locale }: CheckoutFormProps) {
  const t = useTranslations('checkout')
  const cartT = useTranslations('cart')
  const commonT = useTranslations('common')
  const validation = useTranslations('checkout.validation')
  const requiredString = z.string({
    required_error: validation('required'),
    invalid_type_error: validation('required'),
  })
  const schema = z.object({
    firstName: requiredString.min(1, validation('required')),
    lastName: requiredString.min(1, validation('required')),
    email: requiredString.email(validation('invalidEmail')),
    phone: requiredString.min(5, validation('required')),
    country: requiredString.min(1, validation('required')),
    addressLine1: requiredString.min(1, validation('required')),
    addressLine2: requiredString.optional(),
    city: requiredString.min(1, validation('required')),
    state: requiredString.optional(),
    postalCode: requiredString.optional(),
    deliveryMethod: z.enum(['standard', 'express'], {
      errorMap: () => ({ message: validation('selectDeliveryMethod') }),
    }),
    paymentMethodId: z.string({
      required_error: validation('selectPaymentMethod'),
      invalid_type_error: validation('selectPaymentMethod'),
    }).min(1, validation('selectPaymentMethod')),
  })
  type FormData = z.infer<typeof schema>
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
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-8 flex items-center gap-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center border text-[11px] font-medium transition-colors ${
                  s === step
                    ? 'border-primary bg-primary/10 text-foreground'
                    : s < step
                    ? 'border-primary/60 bg-primary/5 text-muted-foreground'
                    : 'border-primary/20 text-muted-foreground'
                }`}
              >
                {s}
              </div>
              <span className={`text-[10px] uppercase tracking-[0.15em] ${s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? cartT('shipping') : t('paymentStep')}
              </span>
              {s < 2 && <div className="h-px w-8 bg-primary/15" />}
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
                <InputField label={t('shippingAddress.firstName')} error={errors.firstName?.message} {...register('firstName')} />
                <InputField label={t('shippingAddress.lastName')} error={errors.lastName?.message} {...register('lastName')} />
                <InputField label={t('shippingAddress.email')} type="email" error={errors.email?.message} {...register('email')} />
                <InputField label={t('shippingAddress.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('shippingAddress.country')}</label>
                <select
                  {...register('country')}
                  className="w-full border border-input bg-background px-4 py-3 text-xs text-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="">{t('selectCountry')}</option>
                  {COUNTRIES.map((code) => (
                    <option key={code} value={code} className="bg-background">{t(`countries.${code}`)}</option>
                  ))}
                </select>
                <FieldError message={errors.country?.message} />
              </div>

              <InputField label={t('shippingAddress.addressLine1')} error={errors.addressLine1?.message} {...register('addressLine1')} />
              <InputField label={t('shippingAddress.addressLine2')} {...register('addressLine2')} />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InputField label={t('shippingAddress.city')} error={errors.city?.message} {...register('city')} />
                {showState && (
                  <InputField label={t('shippingAddress.state')} {...register('state')} />
                )}
                <InputField label={t('shippingAddress.postalCode')} {...register('postalCode')} />
              </div>

              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('shippingMethod')}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { value: 'standard', label: t('delivery.standard'), price: formatPrice(35, 'EUR', localeStr), time: t('delivery.days', { min: 7, max: 14 }) },
                    { value: 'express', label: t('delivery.express'), price: formatPrice(75, 'EUR', localeStr), time: t('delivery.days', { min: 2, max: 5 }) },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-1 border p-4 transition-colors ${
                        deliveryMethod === opt.value
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-primary/20 hover:border-primary/35'
                      }`}
                    >
                      <input type="radio" value={opt.value} {...register('deliveryMethod')} className="sr-only" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{opt.label}</span>
                        <span className="font-serif text-sm text-foreground">{opt.price}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{opt.time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={goToStep2}
                className="mt-2 flex items-center justify-center border border-primary/40 bg-primary/10 py-4 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-primary/20"
              >
                {t('continueToPayment')} →
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
              <div data-testid="payment-section">
                <p className="mb-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('paymentMethod')}</p>
                {derivedRegion === 'CIS' && (
                  <p className="mb-3 text-[10px] text-muted-foreground">
                    {t('yookassaNotice')}
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className="flex cursor-pointer items-center gap-3 border border-primary/20 p-4 transition-colors hover:border-primary/40"
                    >
                      <input
                        type="radio"
                        value={method.id}
                        {...register('paymentMethodId')}
                        className="sr-only"
                      />
                      <div className="h-4 w-4 shrink-0 rounded-full border border-primary/40 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
                      </div>
                      <span className="text-xs text-muted-foreground">{locale === 'ru' ? method.label.ru : locale === 'de' ? method.label.de : method.label.en}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.paymentMethodId?.message} />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-primary/20 px-6 py-4 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  ← {commonT('back')}
                </button>
                <button
                  type="submit"
                  data-testid="checkout-submit"
                  disabled={submitting}
                  className="flex-1 border border-primary bg-primary py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  {submitting ? t('processing') : t('placeOrder')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:sticky lg:top-24 h-fit">
        <div className="border border-primary/15 p-6">
          <p className="mb-5 font-serif text-base text-foreground">{t('orderSummary')}</p>
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
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {getLocalizedField(item.product as unknown as Record<string, string | null | undefined>, 'name', locale) || commonT('item')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">×{item.quantity}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-foreground">
                  {formatPrice(item.priceEur * item.quantity, 'EUR', localeStr)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-primary/10 pt-4 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{cartT('subtotal')}</span>
              <span>{formatPrice(totalEur, 'EUR', localeStr)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{cartT('shipping')}</span>
              <span>{formatPrice(shippingCost, 'EUR', localeStr)}</span>
            </div>
            <div className="flex justify-between border-t border-primary/10 pt-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{cartT('total')}</span>
              <span className="font-serif text-base text-foreground">
                {formatPrice(totalEur + shippingCost, 'EUR', localeStr)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
