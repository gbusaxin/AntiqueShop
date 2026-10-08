import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseServer'
import { categorySchema, errorResponse, isAdmin } from '../_shared'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = categorySchema.partial().refine((value) => Object.keys(value).length > 0, 'No changes supplied').safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const { data, error } = await createAdminClient().from('categories')
      .update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id)
      .select('id, slug, name_ru, name_en, name_de, description_ru, description_en, description_de, image_url, sort_order, is_active, created_at, updated_at').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ category: data })
  } catch (error) {
    const failure = errorResponse(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })

  try {
    const client = createAdminClient()
    const { count, error: countError } = await client.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id)
    if (countError || count === null) throw countError ?? new Error('Unable to count products')
    if (count > 0) return NextResponse.json({ error: `Cannot delete: ${count} product${count === 1 ? '' : 's'} use this category`, product_count: count }, { status: 409 })
    const { data, error } = await client.from('categories').delete().eq('id', id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const failure = errorResponse(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
}
