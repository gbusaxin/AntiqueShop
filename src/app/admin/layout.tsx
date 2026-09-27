import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseServer'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Toaster } from 'sonner'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/en/auth/login?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/en/auth/login?next=/admin')

  const adminClient = createAdminClient()
  const { count: unreadCount } = await adminClient
    .from('contact_requests')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <AdminSidebar email={user.email ?? ''} />
      <div className="ml-56 flex flex-1 flex-col">
        <AdminTopbar unreadCount={unreadCount ?? 0} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg)',
            color: 'var(--fg)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  )
}
