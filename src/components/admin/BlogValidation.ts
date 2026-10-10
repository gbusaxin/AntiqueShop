import type { BlogPost } from '@/components/blog/types'

export const BLOG_LANGUAGES = ['ru', 'en', 'de'] as const
export type BlogLanguage = typeof BLOG_LANGUAGES[number]
export type BlogValues = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at'>
export const BLOG_UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
export const BLOG_UPLOAD_MAX_SIZE = 10 * 1024 * 1024

export function emptyBlogValues(): BlogValues {
  return {
    slug: '', title_ru: '', title_en: '', title_de: '',
    excerpt_ru: '', excerpt_en: '', excerpt_de: '',
    content_ru: '', content_en: '', content_de: '',
    tags: [], images: [], is_published: false,
  }
}

export function hasBlogTranslation(values: BlogValues) {
  return BLOG_LANGUAGES.some((language) => values[`title_${language}`].trim() && values[`content_${language}`].trim())
}

export function isBlogImageUrl(value: string): boolean {
  try {
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    const url = new URL(value)
    const prefix = `${base.pathname.replace(/\/$/, '')}/storage/v1/object/public/blog-images/`
    const path = decodeURIComponent(url.pathname)
    const objectPath = path.slice(prefix.length)
    return url.origin === base.origin && ['https:', 'http:'].includes(url.protocol)
      && !url.username && !url.password && !url.search && !url.hash
      && path.startsWith(prefix) && objectPath.length > 0
      && !objectPath.split('/').some((segment) => !segment || segment === '.' || segment === '..')
      && !/[\u0000-\u0020\u007f\\]/.test(path)
  } catch {
    return false
  }
}

export function validateBlog(values: BlogValues): string[] {
  const errors: string[] = []
  if (!values.slug || values.slug.length > 160 || !/^[a-z0-9-]+$/.test(values.slug)
    || values.slug.startsWith('-') || values.slug.endsWith('-') || values.slug.includes('--')) {
    errors.push('Slug must contain lowercase ASCII letters or numbers separated by single hyphens, up to 160 characters.')
  }
  for (const language of BLOG_LANGUAGES) {
    if (values[`title_${language}`].length > 300) errors.push(`${language.toUpperCase()} title must be at most 300 characters.`)
    if (values[`excerpt_${language}`].length > 1000) errors.push(`${language.toUpperCase()} excerpt must be at most 1,000 characters.`)
    if (values[`content_${language}`].length > 50000) errors.push(`${language.toUpperCase()} body must be at most 50,000 characters.`)
  }
  if (values.tags.length > 20 || values.tags.some((tag) => !tag.trim() || tag.length > 60)) {
    errors.push('Use up to 20 tags, each between 1 and 60 characters.')
  }
  if (values.images.length > 10 || values.images.some((url) => !isBlogImageUrl(url))) {
    errors.push('Use up to 10 images uploaded to the blog image library.')
  }
  if (values.is_published && !hasBlogTranslation(values)) {
    errors.push('Publishing requires a title and body in the same language (RU, EN or DE).')
  }
  return errors
}

export async function blogResponse(response: Response): Promise<{ item?: BlogPost; url?: string; ok?: boolean }> {
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'The request failed. Please try again.')
  if (!result || typeof result !== 'object') throw new Error('The server returned an invalid response. Please reload before trying again.')
  return result
}
