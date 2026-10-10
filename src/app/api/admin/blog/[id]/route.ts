import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID } from '@/lib/validation'
import { blogSchema, blogError, canPublish, readBlogBody, requireAdmin, revalidateBlog } from '../_shared'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const patch = blogSchema.partial().safeParse(await readBlogBody(request))
  if (!patch.success || !Object.keys(patch.data).length) {
    return NextResponse.json({ error: 'Invalid blog fields' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { data: existing, error: loadError } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle()
  if (loadError) return blogError(loadError)
  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  const merged = blogSchema.safeParse({
    ...Object.fromEntries(Object.keys(blogSchema.shape).map((key) => [key, existing[key]])),
    ...patch.data,
  })
  if (!merged.success) return NextResponse.json({ error: 'Invalid blog fields' }, { status: 400 })
  if (!canPublish(merged.data)) {
    return NextResponse.json({ error: 'Publication requires a title and body in the same language' }, { status: 400 })
  }
  const publishedAt = merged.data.is_published
    ? existing.published_at ?? new Date().toISOString()
    : null
  const { data: item, error } = await supabase.from('blog_posts')
    .update({ ...patch.data, published_at: publishedAt }).eq('id', id).select('*').maybeSingle()
  if (error) return blogError(error)
  if (!item) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  revalidateBlog(existing.slug, item.slug)
  return NextResponse.json({ item })
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const { data: item, error } = await createAdminClient().from('blog_posts')
    .delete().eq('id', id).select('slug').maybeSingle()
  if (error) return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  if (!item) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  revalidateBlog(item.slug)
  return NextResponse.json({ ok: true })
}
