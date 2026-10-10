import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabaseServer'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

function isBlogImage(value: string) {
  try {
    const url = new URL(value)
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    return url.origin === base.origin && !url.search && !url.hash &&
      /^\/storage\/v1\/object\/public\/blog-images\/blog\/[0-9a-f-]{36}\.webp$/.test(url.pathname)
  } catch {
    return false
  }
}

export const blogSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/)
    .refine((slug) => slug.split('-').every(Boolean), 'Invalid slug'),
  title_ru: z.string().trim().max(300).default(''),
  title_en: z.string().trim().max(300).default(''),
  title_de: z.string().trim().max(300).default(''),
  excerpt_ru: z.string().trim().max(1000).default(''),
  excerpt_en: z.string().trim().max(1000).default(''),
  excerpt_de: z.string().trim().max(1000).default(''),
  content_ru: z.string().max(50000).default(''),
  content_en: z.string().max(50000).default(''),
  content_de: z.string().max(50000).default(''),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).transform((tags) => [...new Set(tags)]).default([]),
  images: z.array(z.string().max(2048).refine(isBlogImage, 'Invalid blog image URL')).max(10)
    .refine((images) => new Set(images).size === images.length, 'Duplicate images').default([]),
  is_published: z.boolean().default(false),
}).strict()

export function canPublish(post: z.infer<typeof blogSchema>) {
  return !post.is_published || (['ru', 'en', 'de'] as const).some((locale) =>
    post[`title_${locale}`].trim() && post[`content_${locale}`].trim())
}

export async function readBlogBody(request: Request) {
  try {
    const text = await request.text()
    if (text.length > 1_000_000) return null
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function blogError(error: { code?: string }) {
  if (error.code === '23505') return NextResponse.json({ error: 'This slug is already in use' }, { status: 409 })
  return NextResponse.json({ error: 'Failed to save blog post' }, { status: 500 })
}

export function revalidateBlog(...slugs: string[]) {
  revalidatePath('/admin/blog')
  for (const locale of ['ru', 'en', 'de']) {
    revalidatePath(`/${locale}/blog`)
    for (const slug of new Set(slugs)) revalidatePath(`/${locale}/blog/${slug}`)
  }
}
