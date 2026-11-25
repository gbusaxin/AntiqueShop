'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { useRegionStore } from '@/store/regionStore'
import {
  getPaymentMethodsForRegion,
  getPaymentProvider,
  type ProviderAvailability,
} from '@/lib/getPaymentProvidersForRegion'
import { formatPrice } from '@/lib/getPriceForRegion'
import { getRegionFromCountryCode } from '@/lib/region'
import { getLocalizedField } from '@/lib/getLocalizedField'
import { CountryCombobox } from '@/components/checkout/CountryCombobox'
import { trackEcommerce } from '@/lib/analytics'
import type { Locale, PaymentMethod } from '@/types'

const STATE_COUNTRIES = ['US', 'CA', 'AU']

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p role="alert" className="mt-1 text-[11px] text-red-700 dark:text-red-400">{message}</p>
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
        className="field-lux !px-4 !py-3 !text-sm"
      />
      <FieldError message={error} />
    </div>
  )
}

interface CheckoutFormProps {
  locale: Locale
  paymentAvailability: ProviderAvailability
}

type WalletSupport = { apple_pay: boolean; google_pay: boolean }

/** Wallets the browser can actually use: Apple Pay needs Safari / an Apple device, Google Pay doesn't run in Safari */
function detectWallets(): WalletSupport {
  const w = window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } }
  let apple = false
  try {
    apple = Boolean(w.ApplePaySession?.canMakePayments?.())
  } catch {
    apple = false
  }
  const isSafari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent)
  return { apple_pay: apple, google_pay: !isSafari }
}

const CHECKOUT_ERRORS = [
  'invalid_request', 'method_unavailable', 'not_available', 'reserved', 'price_changed',
  'not_configured', 'provider_error', 'server_error', 'rate_limited',
] as const
type CheckoutErrorCode = (typeof CHECKOUT_ERRORS)[number] | 'network'

export function CheckoutForm({ locale, paymentAvailability }: CheckoutFormProps) {
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
  const [submitError, setSubmitError] = useState<CheckoutErrorCode | null>(null)
  const [wallets, setWallets] = useState<WalletSupport | null>(null)
  const errorsT = useTranslations('checkout.errors')
  const hintsT = useTranslations('checkout.methodHints')
  const router = useRouter()
  const { items, totalEur } = useCartStore()
  const { region: storeRegion } = useRegionStore()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: '', deliveryMethod: 'standard' },
  })

  const watchedCountry = watch('country')
  const derivedRegion = watchedCountry ? getRegionFromCountryCode(watchedCountry) : storeRegion
  const provider = getPaymentProvider(derivedRegion, paymentAvailability)
  const paymentMethods = getPaymentMethodsForRegion(derivedRegion, paymentAvailability, watchedCountry).filter(
    (m: PaymentMethod) => !m.wallet || Boolean(m.wallet === 'apple_pay' ? wallets?.apple_pay : wallets?.google_pay)
  )
  const selectedMethod = watch('paymentMethodId')
  const methodIds = paymentMethods.map((m) => m.id).join(',')

  useEffect(() => {
    setWallets(detectWallets())
  }, [])

  // Once per visit to the checkout page
  useEffect(() => {
    const { items: cartItems, totalEur: cartTotal } = useCartStore.getState()
    if (!cartItems.length) return
    trackEcommerce('begin_checkout', {
      value: cartTotal,
      items: cartItems.map((i) => ({
        id: i.product.sku || i.product.id,
        name: i.product.name_en ?? i.product.name_ru ?? i.product.slug,
        price: i.priceEur,
        quantity: i.quantity,
      })),
    })
  }, [])

  // A new shipping country can rule out the method picked before (Klarna, SEPA, YooKassa)
  useEffect(() => {
    if (selectedMethod && !methodIds.split(',').includes(selectedMethod)) {
      setValue('paymentMethodId', '', { shouldValidate: false })
    }
  }, [methodIds, selectedMethod, setValue])
  const showState = STATE_COUNTRIES.includes(watchedCountry)

  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  const deliveryMethod = watch('deliveryMethod')

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
    setSubmitError(null)
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
          locale,
        }),
      })

      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }

      if (res.ok && json.url) {
        // The cart is cleared on the success page, so "back" from the payment page keeps it
        window.location.href = json.url
        return
      }
      const code = CHECKOUT_ERRORS.find((c) => c === json.error) ?? 'server_error'
      setSubmitError(code)
      if (code === 'price_changed' || code === 'not_available') router.refresh()
    } catch {
      setSubmitError('network')
    }
    setSubmitting(false)
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
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CountryCombobox value={field.value} onChange={field.onChange} error={!!errors.country} />
                  )}
                />
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
                    { value: 'standard', label: t('delivery.standard'), time: t('delivery.days', { min: 7, max: 14 }) },
                    { value: 'express', label: t('delivery.express'), time: t('delivery.days', { min: 2, max: 5 }) },
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
                      <span className="text-xs text-foreground">{opt.label}</span>
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
                {provider === 'yookassa' && (
                  <p className="mb-3 text-[10px] text-muted-foreground">
                    {t('yookassaNotice')}
                  </p>
                )}
                <div role="radiogroup" className="flex flex-col gap-3">
                  {paymentMethods.map((method) => {
                    const checked = selectedMethod === method.id
                    const hintKey = method.wallet ? 'wallet' : method.id === 'sepa' ? 'sepa' : method.id === 'klarna' ? 'klarna' : null
                    const hint = hintKey ? hintsT(hintKey) : null
                    return (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-gold ${
                          checked ? 'border-gold/60 bg-gold/[0.04]' : 'border-primary/20 hover:border-primary/40'
                        }`}
                      >
                        <input
                          type="radio"
                          value={method.id}
                          {...register('paymentMethodId')}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            checked ? 'border-gold-rich' : 'border-primary/40'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full bg-gold-rich transition-transform duration-300 ${checked ? 'scale-100' : 'scale-0'}`}
                          />
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className={`text-xs ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {locale === 'ru' ? method.label.ru : locale === 'de' ? method.label.de : method.label.en}
                          </span>
                          {hint && checked && (
                            <span className="text-[11px] leading-relaxed text-muted-foreground">{hint}</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <FieldError message={errors.paymentMethodId?.message} />
                {submitError && (
                  <p role="alert" className="mt-4 border border-red-700/30 bg-red-400/5 p-3 text-[12px] leading-relaxed text-red-700 dark:border-red-400/30 dark:text-red-400">
                    {errorsT(submitError)}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost"
                >
                  ← {commonT('back')}
                </button>
                <button
                  type="submit"
                  data-testid="checkout-submit"
                  disabled={submitting}
                  className="btn-lux flex-1"
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
            <div className="flex justify-between border-t border-primary/10 pt-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{cartT('total')}</span>
              <span className="font-serif text-base text-foreground">
                {formatPrice(totalEur, 'EUR', localeStr)}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t('shipping_note')}</p>
          </div>
        </div>
      </div>
    </form>
  )
}
