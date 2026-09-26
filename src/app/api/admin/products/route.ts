import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidCondition, isHttpsUrl, sanitizeString } from '@/lib/validation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    name_ru, name_en, name_de,
    description_ru, description_en, description_de,
    provenance_ru, provenance_en, provenance_de,
    era, material, country_of_origin, condition, year_circa,
    price_eur, category_id, is_available, images,
  } = body

  const parsedPrice = typeof price_eur === 'number' ? price_eur : parseFloat(price_eur)
  if (!parsedPrice || parsedPrice <= 0 || parsedPrice > 10_000_000) {
    return NextResponse.json({ error: 'price_eur is required and must be positive' }, { status: 400 })
  }

  if (condition && !isValidCondition(condition)) {
    return NextResponse.json({ error: 'Invalid condition value' }, { status: 400 })
  }

  const rawImages: unknown[] = Array.isArray(images) ? images : []
  const safeImages = rawImages.filter((url) => isHttpsUrl(url)) as string[]

  const baseName = sanitizeString(name_en ?? name_ru ?? name_de, 200) ?? 'item'
  const slug = `${generateSlug(baseName)}-${Date.now()}`

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      slug,
      name_ru: sanitizeString(name_ru, 500),
      name_en: sanitizeString(name_en, 500),
      name_de: sanitizeString(name_de, 500),
      description_ru: sanitizeString(description_ru, 5000),
      description_en: sanitizeString(description_en, 5000),
      description_de: sanitizeString(description_de, 5000),
      provenance_ru: sanitizeString(provenance_ru, 2000),
      provenance_en: sanitizeString(provenance_en, 2000),
      provenance_de: sanitizeString(provenance_de, 2000),
      era: sanitizeString(era, 100),
      material: sanitizeString(material, 200),
      country_of_origin: sanitizeString(country_of_origin, 100),
      condition: isValidCondition(condition) ? condition : null,
      year_circa: sanitizeString(year_circa, 20),
      price_eur: parsedPrice,
      category_id: category_id || null,
      is_available: is_available ?? true,
      images: safeImages,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[admin products POST]', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
