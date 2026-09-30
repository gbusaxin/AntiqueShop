'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})
type FormData = z.infer<typeof schema>

export function RegisterClient() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    })
    if (error) {
      setServerError('Registration failed. Please try again.')
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/'), 2500)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f18] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center border border-gold/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-gold-rich">
              <path d="M5 14L11 20L23 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-serif text-xl text-gold-rich">Account Created</p>
          <p className="text-xs text-[#c8bfaa]/60">Check your email to confirm your address.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1f18] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <p className="font-serif text-2xl text-gold-rich tracking-wide">Belle Époque</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-gold/50">Create Account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {(
            [
              { key: 'name', label: 'Full Name', type: 'text', autocomplete: 'name' },
              { key: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
              { key: 'password', label: 'Password', type: 'password', autocomplete: 'new-password' },
            ] as { key: keyof FormData; label: string; type: string; autocomplete: string }[]
          ).map(({ key, label, type, autocomplete }) => (
            <div key={key}>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">
                {label}
              </label>
              <input
                type={type}
                autoComplete={autocomplete}
                {...register(key)}
                className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/25 focus:border-gold/60 focus:outline-none"
              />
              {errors[key] && (
                <p className="mt-1 text-[10px] text-red-400">{errors[key]?.message}</p>
              )}
            </div>
          ))}

          {serverError && <p className="text-[11px] text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-gold/40 bg-gold/10 py-3.5 text-xs uppercase tracking-[0.2em] text-gold-rich transition-all hover:bg-gold hover:text-emerald-dark disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>

          <p className="text-center text-[10px] text-gold/50">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold/70 hover:text-gold-rich transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
