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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <p className="font-serif text-2xl text-foreground tracking-wide">Belle Époque</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Sign In</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              {...register('email')}
              className="w-full border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              {...register('password')}
              className="w-full border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            {errors.password && <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-[11px] text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-primary bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <Link href="/auth/register" className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">
              Create an account
            </Link>
            <Link href="/auth/forgot-password" className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
