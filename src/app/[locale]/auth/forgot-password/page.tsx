'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'
import { authRedirectUrl } from '@/lib/authRedirect'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const validation = useTranslations('auth.validation')
  const locale = useLocale()
  const schema = z.object({
    email: z.string().min(1, validation('required')).email(validation('invalidEmail')),
  })
  type FormData = z.infer<typeof schema>
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit({ email }: FormData) {
    setLoading(true)
    setError('')
    try {
      const redirectTo = authRedirectUrl(locale, 'recovery')
      const { error: failure } = await createClient().auth.resetPasswordForEmail(email, { redirectTo })
      if (failure) setError(t('error'))
      else setSent(true)
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-display text-3xl font-medium tracking-wide text-foreground">Vintag<span className="italic text-gold">Empire</span></p>
          <h1 className="heading-display mt-3 text-4xl text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {sent ? (
          <p role="status" className="text-sm text-foreground">{t('sent')}</p>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="recovery-email" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('email')}</label>
              <input id="recovery-email" type="email" autoComplete="email" {...register('email')} className="field-lux !px-4 !py-3 !text-sm" />
              {errors.email && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">{errors.email.message}</p>}
            </div>
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-lux">{loading ? t('submitting') : t('submit')}</button>
          </form>
        )}
        <p className="text-center text-base"><Link href="/auth/login" className="text-foreground underline underline-offset-2">{t('backToLogin')}</Link></p>
      </div>
    </div>
  )
}
