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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw new Error('Unable to verify admin access')
  if (profile?.role !== 'admin') redirect('/en/account/orders')

  const adminClient = createAdminClient()
  const { count: unreadCount } = await adminClient
    .from('contact_requests')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  return (
    <div className="admin-theme flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)] md:flex-row">
      <AdminSidebar email={user.email ?? ''} />
      <div className="flex min-w-0 flex-1 flex-col md:ml-56">
        <AdminTopbar unreadCount={unreadCount ?? 0} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
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
