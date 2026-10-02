import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient, createAdminClient } from '@/lib/supabaseServer'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
const MAX_DIMENSION = 2000
const WEBP_QUALITY = 85

function hasValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (jpeg) return true
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  if (png) return true
  const webpRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  if (webpRiff) return true
  const avifFtyp =
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  if (avifFtyp) return true
  return false
}

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

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!hasValidImageMagicBytes(buffer)) {
    return NextResponse.json({ error: 'Invalid file content' }, { status: 400 })
  }

  let processedBuffer: Buffer
  try {
    processedBuffer = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
  } catch (err) {
    console.error('[upload] sharp processing failed', err)
    return NextResponse.json({ error: 'Image processing failed' }, { status: 400 })
  }

  const filename = `products/${crypto.randomUUID()}.webp`

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('products-images')
    .upload(filename, processedBuffer, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) {
    console.error('[upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
