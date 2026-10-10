import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabaseServer'
import { requireAdmin } from '../_shared'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
    return NextResponse.json({ error: 'Choose a JPEG, PNG, WebP or AVIF image' }, { status: 400 })
  }
  if (!file.size || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Images must be between 1 byte and 10MB' }, { status: 400 })
  }
  let buffer: Buffer
  try {
    buffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid or oversized image content' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const path = `blog/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage.from('blog-images').upload(path, buffer, {
    contentType: 'image/webp', upsert: false,
  })
  if (error) return NextResponse.json({ error: 'Image upload failed' }, { status: 500 })
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
