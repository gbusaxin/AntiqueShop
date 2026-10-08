import { createAdminClient } from '@/lib/supabaseServer'
import { ContentEditor } from '@/components/admin/ContentEditor'
import { CONTENT_PAGES, type ContentItem } from '@/components/admin/MarkdownEditor'

export default async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const activePage = CONTENT_PAGES.find((item) => item.key === page || item.path === page) ?? CONTENT_PAGES[0]
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_content')
    .select('id, page_key, title_ru, title_en, title_de, content_ru, content_en, content_de, metadata, updated_at, updated_by')
    .in('page_key', CONTENT_PAGES.map((item) => item.key))
  const contents = (data ?? []) as ContentItem[]
  const item = contents.find((item) => item.page_key === activePage.key) ?? {
    id: null,
    page_key: activePage.key,
    metadata: {},
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-[var(--fg)]">Site Content</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {CONTENT_PAGES.map((page) => (
          <a
            key={page.key}
            href={`/admin/content?page=${page.key}`}
            aria-current={activePage.key === page.key ? 'page' : undefined}
            className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-colors ${
              activePage.key === page.key
                ? 'border border-[var(--accent)] text-[var(--admin-accent-text)]'
                : 'border border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--accent)]/40'
            }`}
          >
            {page.label}
          </a>
        ))}
      </div>
      {error ? (
        <p role="alert" className="admin-status-red">Failed to load site content. Please reload before editing.</p>
      ) : (
        <ContentEditor key={item.page_key} item={item} />
      )}
    </div>
  )
}
