import { createAdminClient } from '@/lib/supabaseServer'
import { ContentEditor } from '@/components/admin/ContentEditor'
import { FileText } from 'lucide-react'

const PAGES = ['about', 'contacts', 'legal/offer', 'legal/privacy']

export default async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: activePage = 'about' } = await searchParams
  const supabase = createAdminClient()

  const { data: contents } = await supabase
    .from('site_content')
    .select('*')
    .eq('page', activePage)
    .order('section')

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-[var(--fg)]">Site Content</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <a
            key={p}
            href={`/admin/content?page=${p}`}
            className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-colors ${
              activePage === p
                ? 'border border-[var(--accent)] text-[var(--admin-accent-text)]'
                : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
            }`}
          >
            /{p}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {(contents ?? []).map((item) => (
          <ContentEditor key={item.id} item={item} />
        ))}

        {(contents ?? []).length === 0 && (
          <div className="admin-card py-20 text-center">
            <FileText size={36} className="mx-auto mb-3 text-[var(--fg-muted)]" />
            <p className="text-[var(--fg-muted)]">No content rows for /{activePage}</p>
            <p className="mt-1 text-[12px] text-[var(--fg-muted)]">
              Add rows to the site_content table in Supabase with page = &quot;{activePage}&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
