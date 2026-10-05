import { createAdminClient } from '@/lib/supabaseServer'
import { ContactRow } from '@/components/admin/ContactRow'

export default async function AdminContacts() {
  const supabase = createAdminClient()
  const { data: contacts } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const unread = (contacts ?? []).filter((c) => !c.is_read).length

  return (
    <div>
      <div className="mb-8 flex items-baseline gap-3">
        <h1 className="font-serif text-2xl text-[var(--fg)] sm:text-3xl">Contact Requests</h1>
        {unread > 0 && (
          <span className="rounded bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] text-[var(--admin-accent-text)]">
            {unread} unread
          </span>
        )}
      </div>

      <div className="space-y-2">
        {(contacts ?? []).map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
        {(contacts ?? []).length === 0 && (
          <p className="admin-card py-16 text-center text-sm text-[var(--fg-muted)]">No contact requests yet</p>
        )}
      </div>
    </div>
  )
}
