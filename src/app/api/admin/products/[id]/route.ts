import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID, isHttpsUrl, sanitizeString } from '@/lib/validation'

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
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const schema = z.object({
    name_ru: z.string().trim().min(1).max(500),
    name_en: z.string().max(500).optional().nullable(),
    name_de: z.string().max(500).optional().nullable(),
    description_ru: z.string().trim().min(1).max(5000),
    description_en: z.string().max(5000).optional().nullable(),
    description_de: z.string().max(5000).optional().nullable(),
    provenance_ru: z.string().max(2000).optional().nullable(),
    provenance_en: z.string().max(2000).optional().nullable(),
    provenance_de: z.string().max(2000).optional().nullable(),
    era: z.string().max(100).optional().nullable(),
    material: z.string().trim().min(1).max(200),
    size: z.string().trim().min(1).max(200),
    country_of_origin: z.string().max(100).optional().nullable(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']),
    year_circa: z.string().max(20).optional().nullable(),
    price_eur: z.coerce.number().positive().max(10_000_000),
    category_id: z.string().uuid(),
    sku: z.string().regex(/^\d{7}$/),
    is_available: z.boolean(),
    images: z.array(z.string().url()).max(30),
  }).partial().strict()
  const parsed = schema.safeParse(body)
  if (!parsed.success || (parsed.success && parsed.data.images?.some((url) => !isHttpsUrl(url)))) {
    return NextResponse.json({ error: 'Invalid product fields' }, { status: 400 })
  }

  const input = parsed.data
  const supabase = createAdminClient()
  if (input.category_id) {
    const { data: category } = await supabase.from('categories').select('id').eq('id', input.category_id).single()
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  const optionalStrings = {
    name_en: 500, name_de: 500, description_en: 5000, description_de: 5000,
    provenance_ru: 2000, provenance_en: 2000, provenance_de: 2000,
    era: 100, country_of_origin: 100, year_circa: 20,
  } as const
  for (const key of Object.keys(optionalStrings) as (keyof typeof optionalStrings)[]) {
    if (input[key] !== undefined) update[key] = sanitizeString(input[key], optionalStrings[key])
  }
  for (const key of ['name_ru', 'description_ru', 'material', 'size'] as const) {
    if (input[key] !== undefined) update[key] = input[key]
  }
  for (const key of ['condition', 'price_eur', 'category_id', 'sku', 'is_available', 'images'] as const) {
    if (input[key] !== undefined) update[key] = input[key]
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  const { error } = await supabase.from('products').update(update).eq('id', id)

  if (error) {
    console.error('[admin products PATCH]', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .single()

  if (product?.images?.length) {
    const paths = (product.images as string[]).map((url) => {
      try {
        const u = new URL(url)
        const parts = u.pathname.split('/products-images/')
        return parts[1] ?? ''
      } catch {
        return ''
      }
    }).filter(Boolean)

    if (paths.length) {
      const { error: storageErr } = await supabase.storage
        .from('products-images')
        .remove(paths)
      if (storageErr) {
        console.error('[admin products DELETE] storage cleanup failed', storageErr)
      }
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    console.error('[admin products DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
