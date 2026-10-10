export interface BlogPost {
  id: string
  slug: string
  title_ru: string
  title_en: string
  title_de: string
  excerpt_ru: string
  excerpt_en: string
  excerpt_de: string
  content_ru: string
  content_en: string
  content_de: string
  tags: string[]
  images: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export function localizedBlog(post: BlogPost, locale: string, field: 'title' | 'excerpt' | 'content') {
  const language = locale === 'ru' || locale === 'de' ? locale : 'en'
  return [post[`${field}_${language}`], post[`${field}_en`], post[`${field}_ru`], post[`${field}_de`]]
    .find((value) => value?.trim()) ?? ''
}
