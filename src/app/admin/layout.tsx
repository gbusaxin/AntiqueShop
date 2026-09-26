import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
]

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

  return (
    <div className="flex min-h-screen bg-[#0d1f1a] text-[#f4ead1]">
      <aside className="fixed left-0 top-0 h-full w-60 border-r border-[#c9a84c]/20 bg-[#0a1714]">
        <div className="px-6 py-8">
          <span className="font-serif text-lg tracking-wider text-[#c9a84c]">Belle Époque</span>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-[#c9a84c]/40">Admin Console</p>
        </div>
        <nav className="px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded px-3 py-2.5 text-xs uppercase tracking-wider text-[#f4ead1]/60 transition-colors hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 px-6">
          <p className="text-[10px] text-[#f4ead1]/25">{user.email}</p>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  )
}
