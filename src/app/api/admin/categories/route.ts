import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { categorySchema, errorResponse, isAdmin, listCategories } from './_shared'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    return NextResponse.json({ categories: await listCategories() })
  } catch (error) {
    const failure = errorResponse(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const client = createAdminClient()
    const { data: last, error: orderError } = await client.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1)
    if (orderError) throw orderError
    const { data, error } = await client.from('categories').insert({
      ...parsed.data,
      sort_order: parsed.data.sort_order ?? (last?.[0]?.sort_order ?? -1) + 1,
    }).select('id, slug, name_ru, name_en, name_de, description_ru, description_en, description_de, image_url, sort_order, is_active, created_at, updated_at').single()
    if (error) throw error
    return NextResponse.json({ category: { ...data, product_count: 0 } }, { status: 201 })
  } catch (error) {
    const failure = errorResponse(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
}
