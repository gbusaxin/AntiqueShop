import { createAdminClient } from '@/lib/supabaseServer'
import { ContentEditor } from '@/components/admin/ContentEditor'

export default async function AdminContent() {
  const supabase = createAdminClient()
  const { data: contents } = await supabase
    .from('site_content')
    .select('*')
    .order('page')
    .order('section')

  const grouped: Record<string, typeof contents> = {}
  for (const item of contents ?? []) {
    if (!grouped[item.page]) grouped[item.page] = []
    grouped[item.page]!.push(item)
  }

  return (
    <div>
      <h1 className="mb-8 font-serif text-2xl text-[#c9a84c]">Site Content</h1>
      <div className="space-y-10">
        {Object.entries(grouped).map(([page, items]) => (
          <div key={page}>
            <h2 className="mb-4 text-[11px] uppercase tracking-widest text-[#c9a84c]/60">
              /{page}
            </h2>
            <div className="space-y-4">
              {(items ?? []).map((item) => (
                <ContentEditor key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-[#f4ead1]/30">
            No content rows found. Add rows to the site_content table in Supabase.
          </p>
        )}
      </div>
    </div>
  )
}
