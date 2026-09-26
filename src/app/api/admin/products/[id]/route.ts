import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID, isValidCondition, isHttpsUrl, sanitizeString } from '@/lib/validation'

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

  const body = await request.json()

  if ('condition' in body && body.condition && !isValidCondition(body.condition)) {
    return NextResponse.json({ error: 'Invalid condition value' }, { status: 400 })
  }

  if ('price_eur' in body) {
    const p = typeof body.price_eur === 'number' ? body.price_eur : parseFloat(body.price_eur)
    if (isNaN(p) || p <= 0 || p > 10_000_000) {
      return NextResponse.json({ error: 'Invalid price_eur' }, { status: 400 })
    }
    body.price_eur = p
  }

  const STRING_FIELDS: Record<string, number> = {
    name_ru: 500, name_en: 500, name_de: 500,
    description_ru: 5000, description_en: 5000, description_de: 5000,
    provenance_ru: 2000, provenance_en: 2000, provenance_de: 2000,
    era: 100, material: 200, country_of_origin: 100, year_circa: 20,
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const [key, maxLen] of Object.entries(STRING_FIELDS)) {
    if (key in body) {
      update[key] = sanitizeString(body[key], maxLen)
    }
  }

  if ('condition' in body) update.condition = isValidCondition(body.condition) ? body.condition : null
  if ('price_eur' in body) update.price_eur = body.price_eur
  if ('category_id' in body) update.category_id = body.category_id || null
  if ('is_available' in body) update.is_available = Boolean(body.is_available)

  if (Array.isArray(body.images)) {
    update.images = (body.images as unknown[]).filter((url) => isHttpsUrl(url))
  }

  const supabase = createAdminClient()
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
  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    console.error('[admin products DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
