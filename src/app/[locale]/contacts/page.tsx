'use client'

import { useState } from 'react'
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

export default function ContactsPage() {
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
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setStatus('success')
        reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <section
        className="py-24"
        style={{ background: 'linear-gradient(135deg, #033728 0%, #3d0f0f 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Get in Touch</p>
          <h1 className="mt-4 font-serif text-4xl text-gold-rich">Contact Us</h1>
          <div className="mx-auto mt-5 h-px w-12 bg-gold/40" />
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#c8bfaa]/70">
            Our specialists are always happy to assist with inquiries about specific pieces,
            provenance research, or private viewings.
          </p>
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
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold/50">Our Locations</p>
              <h2 className="mt-3 font-serif text-2xl text-gold-rich">Visit a Gallery</h2>
            </div>

            {[
              {
                city: 'Vienna',
                address: 'Kärntner Ring 14, 1010 Wien, Austria',
                phone: '+43 1 512 44 20',
                email: 'vienna@belleepoque.art',
                hours: 'Mon–Fri 10:00–18:00, Sat 11:00–16:00',
              },
              {
                city: 'Berlin',
                address: 'Fasanenstraße 61, 10719 Berlin, Germany',
                phone: '+49 30 881 62 44',
                email: 'berlin@belleepoque.art',
                hours: 'Mon–Fri 10:00–18:00',
              },
            ].map((loc) => (
              <div key={loc.city} className="border border-gold/15 p-5">
                <p className="mb-3 font-serif text-base text-gold-rich">{loc.city}</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { icon: MapPin, text: loc.address },
                    { icon: Phone, text: loc.phone },
                    { icon: Mail, text: loc.email },
                    { icon: Clock, text: loc.hours },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <Icon size={12} className="mt-0.5 shrink-0 text-gold/50" />
                      <span className="text-xs leading-relaxed text-[#c8bfaa]/70">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold/50">Write to Us</p>
            <h2 className="mt-3 mb-8 font-serif text-2xl text-gold-rich">Send a Message</h2>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-gold/25 bg-gold/5 p-8 text-center"
              >
                <p className="font-serif text-lg text-gold-rich">Message Sent</p>
                <p className="mt-2 text-xs text-[#c8bfaa]/60">
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
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">{label}</label>
                    <input
                      type={type}
                      {...register(key as keyof FormData)}
                      className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/20 focus:border-gold/60 focus:outline-none"
                    />
                    {errors[key as keyof FormData] && (
                      <p className="mt-1 text-[10px] text-red-400">{errors[key as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-gold/60">Message</label>
                  <textarea
                    rows={5}
                    {...register('message')}
                    className="w-full border border-gold/25 bg-transparent px-4 py-3 text-xs text-[#f4ead1] placeholder:text-[#f4ead1]/20 focus:border-gold/60 focus:outline-none resize-none"
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
                  className="border border-gold/40 bg-gold/10 py-3.5 text-xs uppercase tracking-[0.2em] text-gold-rich transition-all hover:bg-gold hover:text-emerald-dark disabled:opacity-50"
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
