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
      className={`border transition-colors ${contact.is_read ? 'border-[#c9a84c]/10' : 'border-[#c9a84c]/30 bg-[#c9a84c]/5'}`}
    >
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); if (!contact.is_read) markRead() }}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {!contact.is_read && (
              <span className="inline-block h-2 w-2 rounded-full bg-[#c9a84c]" />
            )}
            <span className="text-sm text-[#f4ead1]/80">{contact.name}</span>
            <span className="text-xs text-[#f4ead1]/40">{contact.email}</span>
            {contact.locale && (
              <span className="text-[10px] uppercase text-[#c9a84c]/40">{contact.locale}</span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-[#f4ead1]/40">{contact.message}</p>
        </div>
        <span className="shrink-0 text-[10px] text-[#f4ead1]/30">
          {new Date(contact.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[#c9a84c]/15 px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
            {contact.phone && (
              <div>
                <p className="text-[10px] uppercase text-[#c9a84c]/40">Phone</p>
                <p className="text-[#f4ead1]/70">{contact.phone}</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="mb-1 text-[10px] uppercase text-[#c9a84c]/40">Message</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#f4ead1]/70">
              {contact.message}
            </p>
          </div>
          {!contact.is_read && (
            <button
              type="button"
              onClick={markRead}
              disabled={marking}
              className="mt-4 border border-[#c9a84c]/30 px-4 py-1.5 text-[10px] uppercase tracking-wider text-[#c9a84c]/60 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-50"
            >
              {marking ? 'Marking…' : 'Mark as Read'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
