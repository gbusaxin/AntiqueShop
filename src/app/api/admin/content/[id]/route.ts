import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID } from '@/lib/validation'
import { CONTENT_PAGES } from '@/components/admin/MarkdownEditor'

const schema = z.object({
  page_key: z.enum(['about', 'contacts', 'legal_offer', 'legal_privacy']).optional(),
  title_ru: z.string().max(300).nullable().optional(),
  title_en: z.string().max(300).nullable().optional(),
  title_de: z.string().max(300).nullable().optional(),
  content_ru: z.string().max(50000).nullable().optional(),
  content_en: z.string().max(50000).nullable().optional(),
  content_de: z.string().max(50000).nullable().optional(),
  metadata: z.object({
    address: z.string().max(2000).optional(),
    phone: z.string().max(2000).optional(),
    email: z.string().max(2000).optional(),
    working_hours: z.string().max(2000).optional(),
    map_coordinates: z.string().max(2000).optional(),
  }).catchall(z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== 'page_key'), 'No fields to update')

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const page = CONTENT_PAGES.find((page) => page.key === id)
  if (!page && !isValidUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid content fields' }, { status: 400 })
  const { page_key, ...fields } = parsed.data
  if (page && page_key && page_key !== page.key) {
    return NextResponse.json({ error: 'Page key does not match' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const values = { ...fields, updated_by: user.id }
  let query
  if (page) {
    query = supabase.from('site_content').upsert({ ...values, page_key: page.key }, { onConflict: 'page_key' })
  } else {
    query = supabase.from('site_content').update(values).eq('id', id)
    if (page_key) query = query.eq('page_key', page_key)
  }
  const { data: item, error } = await query.select('id, page_key, updated_at, updated_by').maybeSingle()
  if (error) {
    console.error('[admin content PATCH]', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
  if (!item) return NextResponse.json({ error: 'Content not found' }, { status: 404 })

  const savedPage = CONTENT_PAGES.find((page) => page.key === item.page_key)
  if (savedPage) {
    for (const locale of ['ru', 'en', 'de']) revalidatePath(`/${locale}/${savedPage.path}`)
  }
  revalidatePath('/admin/content')
  return NextResponse.json({ ok: true, item })
}
