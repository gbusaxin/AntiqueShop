'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { ContactsMap } from './ContactsMap'
import { getContactMapSettings } from './mapSettings'

type FormData = {
  name: string
  email: string
  phone?: string
  message: string
}

export function ContactsClient({ title, content, metadata, locale }: {
  title: string
  content: ReactNode
  metadata: Record<string, unknown>
  locale: string
}) {
  const t = useTranslations('contacts')
  const schema = z.object({
    name: z.string().min(2, t('form.validation.nameMin', { min: 2 })).max(100, t('form.validation.maxLength', { max: 100 })),
    email: z.string().email(t('form.validation.email')).max(254, t('form.validation.maxLength', { max: 254 })),
    phone: z.string().max(30, t('form.validation.maxLength', { max: 30 })).optional(),
    message: z.string().min(10, t('form.validation.messageMin', { min: 10 })).max(3000, t('form.validation.maxLength', { max: 3000 })),
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const mapSettings = getContactMapSettings(metadata)

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
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{t('eyebrow')}</p>
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
              {t('details')}
            </h2>
            <div className="flex flex-col gap-4 border border-primary/15 p-5">
              {[
                { icon: MapPin, key: 'address' },
                { icon: Phone, key: 'phone' },
                { icon: Mail, key: 'email' },
                { icon: Clock, key: 'working_hours' },
              ].map(({ icon: Icon, key }) => {
                const text = key === 'address' ? metadata.address : key === 'phone' ? metadata.phone : key === 'email' ? (typeof metadata.email === 'string' && metadata.email.trim() ? metadata.email : 'gbusaxin@gmail.com') : metadata.working_hours
                if (typeof text !== 'string' || !text.trim()) return null
                return (
                  <div key={key} className="flex items-start gap-3">
                    <Icon size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                    {key === 'email' ? (
                      <a href={`mailto:${text}`} className="break-all text-xs leading-relaxed text-muted-foreground hover:text-primary">{text}</a>
                    ) : (
                      <span className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{text}</span>
                    )}
                  </div>
                )
              })}
            </div>
            {mapSettings && <ContactsMap settings={mapSettings} locale={locale} />}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{t('form.eyebrow')}</p>
            <h2 className="mt-3 mb-8 font-serif text-2xl text-foreground">{t('form.submit')}</h2>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-primary/25 bg-primary/5 p-8 text-center"
              >
                <p className="font-serif text-lg text-foreground">{t('form.successTitle')}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('form.success')} {t('form.responseTime')}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {[
                  { key: 'name', label: t('form.name'), type: 'text' },
                  { key: 'email', label: t('form.email'), type: 'email' },
                  { key: 'phone', label: t('form.phoneOptional'), type: 'tel' },
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
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t('form.message')}</label>
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
                  <p className="text-[11px] text-red-400">{t('form.error')}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="border border-primary bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  {status === 'loading' ? t('form.sending') : t('form.submit')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
