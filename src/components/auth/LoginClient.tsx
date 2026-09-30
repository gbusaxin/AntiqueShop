'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})
type FormData = z.infer<typeof schema>

export function LoginClient() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/')
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
          <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-gold/50">Sign In</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/25 focus:border-gold/60 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/25 focus:border-gold/60 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-[11px] text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-gold/40 bg-gold/10 py-3.5 text-xs uppercase tracking-[0.2em] text-gold-rich transition-all hover:bg-gold hover:text-emerald-dark disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="flex items-center justify-between text-[10px] text-gold/50">
            <Link href="/auth/register" className="hover:text-gold/80 transition-colors">
              Create an account
            </Link>
            <Link href="/auth/forgot-password" className="hover:text-gold/80 transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
