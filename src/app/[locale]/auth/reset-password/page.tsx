'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const validation = useTranslations('auth.validation')
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const schema = z.object({
    password: z.string().min(8, validation('minCharacters', { count: 8 })),
    confirmPassword: z.string().min(1, validation('required')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordMismatch'),
    path: ['confirmPassword'],
  })
  type FormData = z.infer<typeof schema>
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (active && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setStatus('ready')
    })

    async function checkLink() {
      const params = new URLSearchParams(window.location.search)
      if (params.has('error')) {
        if (active) setStatus('invalid')
        return
      }
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      if (code) {
        const { error: failure } = await supabase.auth.exchangeCodeForSession(code)
        if (failure) {
          if (active) setStatus('invalid')
          return
        }
      } else if (tokenHash) {
        const { error: failure } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        if (failure) {
          if (active) setStatus('invalid')
          return
        }
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (active) setStatus(user ? 'ready' : 'invalid')
    }

    void checkLink()
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function onSubmit({ password }: FormData) {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: failure } = await supabase.auth.updateUser({ password })
      if (failure) {
        setError(t('error'))
        return
      }
      await supabase.auth.signOut({ scope: 'local' })
      toast.success(t('success'))
      router.replace('/auth/login')
      router.refresh()
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
        </div>
        {status === 'checking' && <p role="status" className="text-sm text-muted-foreground">{t('checking')}</p>}
        {status === 'invalid' && (
          <p role="alert" className="text-sm text-red-400">{t('invalidLink')} <Link href="/auth/forgot-password" className="underline">{t('requestAgain')}</Link></p>
        )}
        {status === 'ready' && (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('password')}</label>
              <input id="new-password" type="password" autoComplete="new-password" {...register('password')} className="w-full border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
              {errors.password && <p role="alert" className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('confirmPassword')}</label>
              <input id="confirm-password" type="password" autoComplete="new-password" {...register('confirmPassword')} className="w-full border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
              {errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
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
