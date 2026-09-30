import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { isValidUUID } from '@/lib/validation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { action: string; ids: string[]; value?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, ids, value } = body

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
    return NextResponse.json({ error: 'Invalid ids' }, { status: 400 })
  }

  if (!ids.every(isValidUUID)) {
    return NextResponse.json({ error: 'Invalid id format' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === 'delete') {
    const { data: products } = await supabase
      .from('products')
      .select('images')
      .in('id', ids)

    if (products?.length) {
      const paths: string[] = []
      for (const p of products) {
        if (Array.isArray(p.images)) {
          for (const url of p.images as string[]) {
            try {
              const u = new URL(url)
              const parts = u.pathname.split('/products-images/')
              if (parts[1]) paths.push(parts[1])
            } catch {}
          }
        }
      }
      if (paths.length) {
        await supabase.storage.from('products-images').remove(paths)
      }
    }

    const { error } = await supabase.from('products').delete().in('id', ids)
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    return NextResponse.json({ ok: true, affected: ids.length })
  }

  if (action === 'toggle_availability') {
    if (typeof value !== 'boolean') {
      return NextResponse.json({ error: 'value must be boolean' }, { status: 400 })
    }
    const { error } = await supabase
      .from('products')
      .update({ is_available: value, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ ok: true, affected: ids.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
