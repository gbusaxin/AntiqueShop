'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Required').max(100, 'Too long'),
  email: z.string().email('Invalid email').max(254, 'Too long'),
  phone: z.string().max(30, 'Too long').optional(),
  message: z.string().min(10, 'Please write at least 10 characters').max(3000, 'Message too long'),
})
type FormData = z.infer<typeof schema>

export function ContactsClient({ title, content, metadata, locale }: {
  title: string
  content: ReactNode
  metadata: Record<string, unknown>
  locale: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale }),
      })
      if (res.ok) { setStatus('success'); reset() }
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <section className="bg-primary/10 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Get in Touch</p>
          <h1 className="mt-4 font-serif text-4xl text-foreground">{title}</h1>
          <div className="mx-auto mt-5 h-px w-12 bg-primary/40" />
          <div className="mx-auto mt-6 max-w-3xl text-left text-muted-foreground">{content}</div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="flex flex-col gap-8"
          >
            <h2 className="font-serif text-2xl text-foreground">
              {locale === 'ru' ? 'Контактная информация' : locale === 'de' ? 'Kontaktdaten' : 'Contact details'}
            </h2>
            <div className="flex flex-col gap-4 border border-primary/15 p-5">
              {[
                { icon: MapPin, key: 'address' },
                { icon: Phone, key: 'phone' },
                { icon: Mail, key: 'email' },
                { icon: Clock, key: 'working_hours' },
                { icon: MapPin, key: 'map_coordinates' },
              ].map(({ icon: Icon, key }) => {
                const text = metadata[key]
                if (typeof text !== 'string' || !text.trim()) return null
                return (
                  <div key={key} className="flex items-start gap-3">
                    <Icon size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{text}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Write to Us</p>
            <h2 className="mt-3 mb-8 font-serif text-2xl text-foreground">Send a Message</h2>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-primary/25 bg-primary/5 p-8 text-center"
              >
                <p className="font-serif text-lg text-foreground">Message Sent</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Thank you. We will respond within one business day.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {[
                  { key: 'name', label: 'Your Name', type: 'text' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Phone (optional)', type: 'tel' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</label>
                    <input
                      type={type}
                      {...register(key as keyof FormData)}
                      className="w-full border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                    {errors[key as keyof FormData] && (
                      <p className="mt-1 text-[10px] text-red-400">{errors[key as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Message</label>
                  <textarea
                    rows={5}
                    {...register('message')}
                    className="w-full resize-none border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                  {errors.message && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.message.message}</p>
                  )}
                </div>

                {status === 'error' && (
                  <p className="text-[11px] text-red-400">Could not send message. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="border border-primary bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
