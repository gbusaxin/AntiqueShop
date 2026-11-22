'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'
import { authRedirectUrl } from '@/lib/authRedirect'

export function LoginClient() {
  const t = useTranslations('auth.login')
  const registerT = useTranslations('auth.register')
  const validation = useTranslations('auth.validation')
  const requiredString = z.string({
    required_error: validation('required'),
    invalid_type_error: validation('required'),
  })
  const schema = z.object({
    email: requiredString.email(validation('invalidEmail')),
    password: requiredString.min(6, validation('minCharacters', { count: 6 })),
  })
  type FormData = z.infer<typeof schema>
  const router = useRouter()
  const locale = useLocale()
  const [serverError, setServerError] = useState('')
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    setUnconfirmedEmail('')
    setResendState('idle')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        if (error.code === 'email_not_confirmed') setUnconfirmedEmail(data.email)
        else setServerError(t('invalidCredentials'))
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setServerError(t('error'))
    } finally {
      setLoading(false)
    }
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
          <p className="heading-display text-4xl text-foreground tracking-wide">VintagEmpire</p>
          <p className="mt-2 text-sm uppercase tracking-[0.15em] text-muted-foreground">{t('title')}</p>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('email')}</label>
            <input
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              {...register('email')}
              className="field-lux !px-4 !py-3 !text-sm"
            />
            {errors.email && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('password')}</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder={t('password')}
              {...register('password')}
              className="field-lux !px-4 !py-3 !text-sm"
            />
            {errors.password && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">{errors.password.message}</p>}
          </div>

          {serverError && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{serverError}</p>}
          {unconfirmedEmail && (
            <div role="alert" className="border border-gold/30 bg-card p-4 text-sm text-foreground">
              <p>{t('emailNotConfirmed')}</p>
              {resendState === 'sent' ? (
                <p role="status" className="mt-3 text-muted-foreground">{t('confirmationResent')}</p>
              ) : (
                <button
                  type="button"
                  disabled={resendState === 'sending'}
                  onClick={async () => {
                    setResendState('sending')
                    const { error } = await createClient().auth.resend({
                      type: 'signup',
                      email: unconfirmedEmail,
                      options: { emailRedirectTo: authRedirectUrl(locale, 'signup') },
                    })
                    setResendState(error ? 'error' : 'sent')
                  }}
                  className="link-lux mt-3 text-gold disabled:opacity-50"
                >
                  {t('resendConfirmation')}
                </button>
              )}
              {resendState === 'error' && <p className="mt-2 text-red-700 dark:text-red-400">{t('resendError')}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-lux mt-2"
          >
            {loading ? t('submitting') : t('submit')}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-base text-foreground/80">
            <Link href="/auth/register" className="text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">
              {registerT('title')}
            </Link>
            <Link href="/auth/forgot-password" className="text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">
              {t('forgotPassword')}
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
