import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug || slug.length > 200) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const ip = getClientIp(request)
  const { allowed } = rateLimit(`view:${slug}:${ip}`, 1, 24 * 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ ok: false })
  }

  const supabase = createAdminClient()
  await supabase.rpc('increment_views', { product_slug: slug }).maybeSingle()

  return NextResponse.json({ ok: true })
}
