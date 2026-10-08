import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isHttpsUrl, sanitizeString } from '@/lib/validation'

const productSchema = z.object({
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
  sku: z.union([z.string().trim().regex(/^\d{7}$/), z.literal('')]).optional(),
  is_available: z.boolean().default(true),
  images: z.array(z.string().url()).max(30).default([]),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9а-яё\s-]/gi, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'item'
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const result = productSchema.safeParse(body)
  if (!result.success || result.data.images.some((url) => !isHttpsUrl(url))) {
    return NextResponse.json({ error: 'Required fields or image URLs are invalid', issues: result.success ? undefined : result.error.flatten() }, { status: 400 })
  }

  const input = result.data
  const supabase = createAdminClient()
  const { data: category, error: categoryError } = await supabase.from('categories').select('id').eq('id', input.category_id).single()
  if (categoryError || !category) return NextResponse.json({ error: 'Category not found' }, { status: 400 })

  for (let attempt = 0; attempt < (input.sku ? 1 : 10); attempt++) {
    const sku = input.sku || String(randomInt(1_000_000, 10_000_000))
    const { data, error } = await supabase.from('products').insert({
      sku,
      slug: `${generateSlug(input.name_en || input.name_ru)}-${sku}`,
      name_ru: input.name_ru,
      name_en: sanitizeString(input.name_en, 500),
      name_de: sanitizeString(input.name_de, 500),
      description_ru: input.description_ru,
      description_en: sanitizeString(input.description_en, 5000),
      description_de: sanitizeString(input.description_de, 5000),
      provenance_ru: sanitizeString(input.provenance_ru, 2000),
      provenance_en: sanitizeString(input.provenance_en, 2000),
      provenance_de: sanitizeString(input.provenance_de, 2000),
      era: sanitizeString(input.era, 100),
      material: input.material,
      size: input.size,
      country_of_origin: sanitizeString(input.country_of_origin, 100),
      condition: input.condition,
      year_circa: sanitizeString(input.year_circa, 20),
      price_eur: input.price_eur,
      category_id: input.category_id,
      is_available: input.is_available,
      images: input.images,
    }).select('id, sku').single()

    if (!error && data) return NextResponse.json(data, { status: 201 })
    if (error?.code === '23505' && /sku|slug/.test(error.message)) {
      if (input.sku) return NextResponse.json({ error: 'SKU уже используется' }, { status: 409 })
      continue
    }
    console.error('[admin products POST]', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Could not generate a unique SKU' }, { status: 503 })
}
