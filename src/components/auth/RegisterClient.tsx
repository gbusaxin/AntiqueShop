'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'

export function RegisterClient() {
  const t = useTranslations('auth.register')
  const locale = useLocale()
  const loginT = useTranslations('auth.login')
  const validation = useTranslations('auth.validation')
  const requiredString = z.string({
    required_error: validation('required'),
    invalid_type_error: validation('required'),
  })
  const schema = z.object({
    name: requiredString.min(2, validation('minCharacters', { count: 2 })),
    email: requiredString.email(validation('invalidEmail')),
    password: requiredString.min(8, validation('minCharacters', { count: 8 })),
    terms_accepted: z.literal(true, { errorMap: () => ({ message: t('termsRequired') }) }),
  })
  type FormData = z.infer<typeof schema>
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })
  const termsAccepted = watch('terms_accepted') === true

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    try {
      const emailRedirectTo = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent('/auth/verify')}`
      const supabase = createClient()
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.name, terms_accepted_at: new Date().toISOString() }, emailRedirectTo },
      })
      if (error) {
        setServerError(t('error'))
        return
      }
      setConfirmationRequired(!result.session)
      setSuccess(true)
      if (result.session) {
        router.replace('/')
        router.refresh()
      }
    } catch {
      setServerError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center border border-input">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-foreground">
              <path d="M5 14L11 20L23 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-serif text-xl text-foreground">{t('successTitle')}</p>
          {confirmationRequired && (
            <>
              <p className="text-sm text-muted-foreground">{t('successDescription')}</p>
              <Link href="/auth/login" className="text-base text-foreground underline">{loginT('submit')}</Link>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <p className="font-serif text-2xl text-foreground tracking-wide">VintagEmpire</p>
          <p className="mt-2 text-sm uppercase tracking-[0.15em] text-muted-foreground">{t('title')}</p>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {(
            [
              { key: 'name', label: t('name'), type: 'text', autocomplete: 'name' },
              { key: 'email', label: t('email'), type: 'email', autocomplete: 'email' },
              { key: 'password', label: t('password'), type: 'password', autocomplete: 'new-password' },
            ] as { key: 'name' | 'email' | 'password'; label: string; type: string; autocomplete: string }[]
          ).map(({ key, label, type, autocomplete }) => {
            const fieldError = key === 'name' ? errors.name : key === 'email' ? errors.email : errors.password
            return (
              <div key={key}>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {label}
                </label>
                <input
                  type={type}
                  autoComplete={autocomplete}
                  {...register(key)}
                  className="w-full border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                {fieldError && (
                  <p role="alert" className="mt-1 text-sm text-red-400">{fieldError.message}</p>
                )}
              </div>
            )
          })}

          <div>
            <div className="flex items-start gap-3">
              <input
                id="terms-accepted"
                type="checkbox"
                aria-invalid={!!errors.terms_accepted}
                aria-labelledby="terms-label"
                aria-describedby={errors.terms_accepted ? 'terms-error' : undefined}
                {...register('terms_accepted')}
                className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <span id="terms-label" className="text-sm text-foreground/80">
                {t.rich('termsConsent', {
                  terms: (chunks) => <Link href="/legal/offer" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{chunks}</Link>,
                  privacy: (chunks) => <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{chunks}</Link>,
                })}
              </span>
            </div>
            {errors.terms_accepted && <p id="terms-error" role="alert" className="mt-1 text-sm text-red-400">{errors.terms_accepted.message}</p>}
          </div>

          {serverError && <p role="alert" className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="mt-2 border border-primary bg-primary py-3.5 text-sm uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('submitting') : t('submit')}
          </button>

          <p className="text-center text-base text-foreground/80">
            {t('hasAccount')}{' '}
            <Link href="/auth/login" className="text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">
              {loginT('submit')}
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
