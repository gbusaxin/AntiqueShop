import { createClient } from '@/lib/supabaseServer'
import { ContentText, contentPlaceholder, localizedContent, type ContentItem } from '@/components/admin/MarkdownEditor'

export async function getSiteContent(pageKey: ContentItem['page_key']): Promise<ContentItem | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_content')
    .select('id, page_key, title_ru, title_en, title_de, content_ru, content_en, content_de, metadata, updated_at')
    .eq('page_key', pageKey)
    .maybeSingle()
  if (error) console.error('[site content]', error)
  return error ? null : data as ContentItem | null
}

export async function SiteContentPage({ pageKey, locale, defaultTitle }: {
  pageKey: ContentItem['page_key']
  locale: string
  defaultTitle: string
}) {
  const item = await getSiteContent(pageKey)
  return (
    <div className="min-h-screen bg-background pt-20 text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 border-b border-primary/15 pb-8">
          <h1 className="font-serif text-3xl">{localizedContent(item, locale, 'title') || defaultTitle}</h1>
        </div>
        <ContentText content={localizedContent(item, locale, 'content') || contentPlaceholder(locale)} />
      </div>
    </div>
  )
}
