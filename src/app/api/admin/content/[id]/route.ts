import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID, sanitizeString } from '@/lib/validation'

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
  const { content_ru, content_en, content_de } = body

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('site_content')
    .update({
      content_ru: sanitizeString(content_ru, 50000),
      content_en: sanitizeString(content_en, 50000),
      content_de: sanitizeString(content_de, 50000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin content PATCH]', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
