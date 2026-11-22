'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase'

/** Lets a signed-in customer set a new password without going through the email link. */
export function ChangePasswordForm() {
  const t = useTranslations('account.password')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (password.length < 8) return setError(t('minLength'))
    // eslint-disable-next-line security/detect-possible-timing-attacks -- both values come from this form, not a secret check
    if (password !== confirm) return setError(t('mismatch'))
    setSaving(true)
    try {
      const { error: failure } = await createClient().auth.updateUser({ password })
      if (failure) {
        setError(failure.code === 'same_password' ? t('samePassword') : t('error'))
        return
      }
      setPassword('')
      setConfirm('')
      setMessage(t('saved'))
    } catch {
      setError(t('error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <div>
        <label htmlFor="account-new-password" className="mb-2 block text-sm text-[var(--fg-muted)]">{t('new')}</label>
        <input id="account-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={saving} className="field-lux !px-4 !py-3 !text-sm disabled:opacity-60" />
      </div>
      <div>
        <label htmlFor="account-confirm-password" className="mb-2 block text-sm text-[var(--fg-muted)]">{t('confirm')}</label>
        <input id="account-confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={saving} className="field-lux !px-4 !py-3 !text-sm disabled:opacity-60" />
      </div>
      {message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className="btn-lux">{saving ? t('saving') : t('save')}</button>
    </form>
  )
}
