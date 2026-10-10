import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabaseServer'
import type { BlogPost } from './types'

export const BLOG_PAGE_SIZE = 9
export type BlogSearchParams = Record<string, string | string[] | undefined>

export function parseBlogFilters(params: BlogSearchParams) {
  const rawPage = typeof params.page === 'string' ? params.page : ''
  const number = /^\d{1,7}$/.test(rawPage) ? Number(rawPage) : 1
  const page = Math.max(1, Math.min(1000000, number))
  const tag = typeof params.tag === 'string' ? params.tag.trim().slice(0, 100) : ''
  return { page, tag }
}

export async function getBlogListing(requestedPage: number, tag: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const visibility = `published_at.is.null,published_at.lte.${now}`
  let countQuery = supabase.from('blog_posts').select('id', { count: 'exact', head: true })
    .eq('is_published', true).or(visibility)
  if (tag) countQuery = countQuery.contains('tags', [tag])
  const { count, error: countError } = await countQuery
  if (countError || count === null) throw new Error('Unable to count public blog posts')

  const totalPages = Math.max(1, Math.ceil(count / BLOG_PAGE_SIZE))
  const page = Math.max(1, Math.min(requestedPage, totalPages))
  if (!count) return { posts: [] as BlogPost[], count, page, totalPages }

  const offset = (page - 1) * BLOG_PAGE_SIZE
  let query = supabase.from('blog_posts')
    .select('id, slug, title_ru, title_en, title_de, excerpt_ru, excerpt_en, excerpt_de, tags, images, is_published, published_at, created_at, updated_at')
    .eq('is_published', true).or(visibility)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .range(offset, offset + BLOG_PAGE_SIZE - 1)
  if (tag) query = query.contains('tags', [tag])
  const { data, error } = await query
  if (error) throw new Error('Unable to load public blog posts')
  return { posts: (data ?? []) as BlogPost[], count, page, totalPages }
}

export const getBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').select('*')
    .eq('slug', slug).eq('is_published', true)
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .maybeSingle()
  if (error) throw new Error('Unable to load public blog article')
  return data as BlogPost | null
})
