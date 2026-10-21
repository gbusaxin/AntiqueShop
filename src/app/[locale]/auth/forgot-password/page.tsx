'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'

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
      const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`
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
          <p className="font-serif text-2xl tracking-wide text-foreground">VintagEmpire</p>
          <h1 className="mt-3 font-serif text-xl text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {sent ? (
          <p role="status" className="text-sm text-foreground">{t('sent')}</p>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="recovery-email" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('email')}</label>
              <input id="recovery-email" type="email" autoComplete="email" {...register('email')} className="w-full border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
              {errors.email && <p role="alert" className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="border border-primary bg-primary py-3.5 text-sm uppercase tracking-[0.15em] text-primary-foreground disabled:opacity-50">{loading ? t('submitting') : t('submit')}</button>
          </form>
        )}
        <p className="text-center text-sm"><Link href="/auth/login" className="text-foreground underline">{t('backToLogin')}</Link></p>
      </div>
    </div>
  )
}
