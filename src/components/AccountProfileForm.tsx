'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@supabase/ssr'

interface AccountProfileFormProps {
  email: string
  name: string
  phone: string
  locale: string
}

export function AccountProfileForm({ email, name, phone, locale }: AccountProfileFormProps) {
  const t = useTranslations('account.profile')
  const accountT = useTranslations('account')
  const router = useRouter()
  const [fullName, setFullName] = useState(name)
  const [phoneNumber, setPhoneNumber] = useState(phone)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const client = supabase()
      const { data: { user }, error: authError } = await client.auth.getUser()
      if (authError || !user) throw new Error(t('saveError'))
      const { data, error: updateError } = await client.from('profiles')
        .update({ full_name: fullName.trim(), phone: phoneNumber.trim() || null })
        .eq('id', user.id)
        .select('id')
        .maybeSingle()
      if (updateError || !data) throw new Error(t('saveError'))
      setMessage(t('saved'))
      router.refresh()
    } catch {
      setError(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    setError(null)
    const { error: signOutError } = await supabase().auth.signOut()
    if (signOutError) {
      setError(t('signOutError'))
      setSigningOut(false)
      return
    }
    router.replace(`/${locale}/auth/login`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label htmlFor="account-email" className="mb-2 block text-sm text-[var(--fg-muted)]">{t('email')}</label>
          <input id="account-email" type="email" value={email} readOnly className="w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--fg-muted)]" />
        </div>
        <div>
          <label htmlFor="account-name" className="mb-2 block text-sm text-[var(--fg-muted)]">{t('name')}</label>
          <input id="account-name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={150} autoComplete="name" disabled={saving} className="w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--fg)]" />
        </div>
        <div>
          <label htmlFor="account-phone" className="mb-2 block text-sm text-[var(--fg-muted)]">{t('phone')}</label>
          <input id="account-phone" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={30} autoComplete="tel" disabled={saving} className="w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--fg)]" />
        </div>
        {message && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="border border-[var(--accent)] px-6 py-3 text-sm text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? t('saving') : t('save')}</button>
      </form>
      <button type="button" onClick={signOut} disabled={signingOut} className="text-sm text-[var(--fg-muted)] underline underline-offset-4 hover:text-[var(--accent)] disabled:opacity-50">{signingOut ? t('signingOut') : accountT('signOut')}</button>
    </div>
  )
}
