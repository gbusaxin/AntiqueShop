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
        <h1 className="font-serif text-2xl text-[#c9a84c]">Contact Requests</h1>
        {unread > 0 && (
          <span className="rounded bg-[#c9a84c]/15 px-2 py-0.5 text-[11px] text-[#c9a84c]">
            {unread} unread
          </span>
        )}
      </div>

      <div className="space-y-2">
        {(contacts ?? []).map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
        {(contacts ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-[#f4ead1]/30">No contact requests yet</p>
        )}
      </div>
    </div>
  )
}
