import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { blogSchema, blogError, canPublish, readBlogBody, requireAdmin, revalidateBlog } from './_shared'

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const parsed = blogSchema.safeParse(await readBlogBody(request))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid blog fields' }, { status: 400 })
  if (!canPublish(parsed.data)) {
    return NextResponse.json({ error: 'Publication requires a title and body in the same language' }, { status: 400 })
  }
  const { data: item, error } = await createAdminClient().from('blog_posts')
    .insert({ ...parsed.data, published_at: parsed.data.is_published ? new Date().toISOString() : null })
    .select('*').single()
  if (error) return blogError(error)
  revalidateBlog(item.slug)
  return NextResponse.json({ item }, { status: 201 })
}
