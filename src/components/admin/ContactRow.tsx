'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  locale: string | null
  is_read: boolean
  created_at: string
}

export function ContactRow({ contact }: { contact: Contact }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [marking, setMarking] = useState(false)

  async function markRead() {
    if (contact.is_read) return
    setMarking(true)
    try {
      await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      })
      router.refresh()
    } finally {
      setMarking(false)
    }
  }

  return (
    <div
      className={`admin-card transition-colors ${contact.is_read ? '' : 'border-l-2 !border-l-[var(--accent)]'}`}
    >
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); if (!contact.is_read) markRead() }}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {!contact.is_read && (
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
            )}
            <span className="text-sm text-[var(--fg)]">{contact.name}</span>
            <span className="text-xs text-[var(--fg-muted)]">{contact.email}</span>
            {contact.locale && (
              <span className="text-[10px] uppercase text-[var(--admin-accent-text)]">{contact.locale}</span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-[var(--fg-muted)]">{contact.message}</p>
        </div>
        <span className="shrink-0 text-[10px] text-[var(--fg-muted)]">
          {new Date(contact.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
            {contact.phone && (
              <div>
                <p className="text-[10px] uppercase text-[var(--admin-accent-text)]">Phone</p>
                <p className="text-[var(--fg)]">{contact.phone}</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="mb-1 text-[10px] uppercase text-[var(--admin-accent-text)]">Message</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--fg)]">
              {contact.message}
            </p>
          </div>
          {!contact.is_read && (
            <button
              type="button"
              onClick={markRead}
              disabled={marking}
              className="mt-4 border border-[var(--border)] px-4 py-1.5 text-[10px] uppercase tracking-wider text-[var(--admin-accent-text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--admin-accent-text)] disabled:opacity-50"
            >
              {marking ? 'Marking…' : 'Mark as Read'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
