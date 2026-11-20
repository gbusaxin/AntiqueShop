import { randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { generateProductSlug, sanitizeString } from '@/lib/validation'

/**
 * One-off admin import of the Etsy shop (data/etsy-import/listings.json, prepared from the
 * Etsy CSV export with RU/DE translations).
 *
 * GET               → progress of the current/last run
 * GET ?existing=1   → products already in the DB (to review before cleaning up test data)
 * POST {action:'start'} → starts the import in the background (Railway keeps the process alive)
 *
 * The server downloads photos only from Etsy's image CDN, converts them to WebP and stores them
 * in Supabase Storage. Re-running is safe: listings whose English name already exists are skipped.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATA_FILE = join(process.cwd(), 'data/etsy-import/listings.json')
const ETSY_IMAGE_URL = /^https:\/\/i\.etsystatic\.com\/[A-Za-z0-9/_.-]+$/
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_DIMENSION = 2000
const WEBP_QUALITY = 85

const categorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name_ru: z.string().min(1),
  name_en: z.string().min(1),
  name_de: z.string().min(1),
  sort_order: z.number().int(),
})

const itemSchema = z.object({
  name_ru: z.string().trim().min(1).max(500),
  name_en: z.string().trim().min(1).max(500),
  name_de: z.string().trim().min(1).max(500),
  description_ru: z.string().trim().min(1).max(5000),
  description_en: z.string().trim().min(1).max(5000),
  description_de: z.string().trim().min(1).max(5000),
  material: z.string().trim().min(1).max(200),
  size: z.string().trim().min(1).max(200),
  year_circa: z.string().max(20).nullable(),
  country_of_origin: z.string().regex(/^[A-Z]{2}$/).nullable(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  price_eur: z.number().positive(),
  category: z.string(),
  image_urls: z.array(z.string().regex(ETSY_IMAGE_URL)).min(1).max(10),
})

const fileSchema = z.object({ categories: z.array(categorySchema), items: z.array(itemSchema) })
type Item = z.infer<typeof itemSchema>

interface Progress {
  running: boolean
  total: number
  done: number
  created: number
  skipped: number
  images: number
  failed: { index: number; name: string; error: string }[]
  startedAt: string | null
  finishedAt: string | null
}

// Module-level state: a single Node process serves the site on Railway
const progress: Progress = { running: false, total: 0, done: 0, created: 0, skipped: 0, images: 0, failed: [], startedAt: null, finishedAt: null }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

async function downloadAsWebp(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`image HTTP ${res.status}`)
  if (!(res.headers.get('content-type') ?? '').startsWith('image/')) throw new Error('not an image')
  if (Number(res.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES) throw new Error('image too large')
  const input = Buffer.from(await res.arrayBuffer())
  if (input.length > MAX_IMAGE_BYTES) throw new Error('image too large')
  return sharp(input)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function ensureCategories(categories: z.infer<typeof categorySchema>[]) {
  const supabase = createAdminClient()
  const { data: existing, error } = await supabase.from('categories').select('id, slug')
  if (error) throw error
  const bySlug = new Map((existing ?? []).map((c) => [c.slug as string, c.id as string]))
  for (const category of categories) {
    if (bySlug.has(category.slug)) continue
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ ...category, is_active: true })
      .select('id, slug')
      .single()
    if (insertError || !data) throw insertError ?? new Error(`category ${category.slug}`)
    bySlug.set(data.slug, data.id)
  }
  return bySlug
}

async function importItem(item: Item, categoryId: string): Promise<'created' | 'skipped'> {
  const supabase = createAdminClient()
  const { data: existing } = await supabase.from('products').select('id').eq('name_en', item.name_en).limit(1)
  if (existing?.length) return 'skipped'

  const images: string[] = []
  const paths: string[] = []
  for (const url of item.image_urls) {
    try {
      const webp = await downloadAsWebp(url)
      const path = `products/${crypto.randomUUID()}.webp`
      const { error } = await supabase.storage.from('products-images').upload(path, webp, { contentType: 'image/webp', upsert: false })
      if (error) throw error
      paths.push(path)
      images.push(supabase.storage.from('products-images').getPublicUrl(path).data.publicUrl)
    } catch (err) {
      console.error('[import etsy] image skipped', url, err)
    }
  }
  if (!images.length) throw new Error('no images could be imported')

  for (let attempt = 0; attempt < 10; attempt++) {
    const sku = String(randomInt(1_000_000, 10_000_000))
    const { error } = await supabase.from('products').insert({
      sku,
      slug: generateProductSlug(item.name_en, item.name_ru, sku),
      name_ru: item.name_ru,
      name_en: sanitizeString(item.name_en, 500),
      name_de: sanitizeString(item.name_de, 500),
      description_ru: item.description_ru,
      description_en: sanitizeString(item.description_en, 5000),
      description_de: sanitizeString(item.description_de, 5000),
      material: item.material,
      size: item.size,
      country_of_origin: item.country_of_origin,
      condition: item.condition,
      year_circa: sanitizeString(item.year_circa, 20),
      price_eur: item.price_eur,
      category_id: categoryId,
      is_available: true,
      images,
    })
    if (!error) {
      progress.images += images.length
      return 'created'
    }
    if (error.code === '23505' && /sku|slug/.test(error.message)) continue
    await supabase.storage.from('products-images').remove(paths)
    throw new Error(error.message)
  }
  await supabase.storage.from('products-images').remove(paths)
  throw new Error('could not generate a unique SKU')
}

async function run(items: Item[], categoryIds: Map<string, string>) {
  // Oldest Etsy listing first, so the newest ones end up first in "Newest" sorting
  for (const [index, item] of [...items.entries()].reverse()) {
    try {
      const categoryId = categoryIds.get(item.category)
      if (!categoryId) throw new Error(`unknown category ${item.category}`)
      const result = await importItem(item, categoryId)
      if (result === 'created') progress.created++
      else progress.skipped++
    } catch (err) {
      progress.failed.push({ index, name: item.name_en, error: err instanceof Error ? err.message : String(err) })
    }
    progress.done++
  }
  progress.running = false
  progress.finishedAt = new Date().toISOString()
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (new URL(request.url).searchParams.get('existing') === '1') {
    const { data, error } = await createAdminClient()
      .from('products')
      .select('id, sku, name_ru, name_en, is_available, created_at')
      .order('created_at')
    if (error) return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
    return NextResponse.json({ products: data })
  }
  return NextResponse.json(progress)
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { action?: string } | null
  if (body?.action !== 'start') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  if (progress.running) return NextResponse.json(progress, { status: 409 })

  const parsed = fileSchema.safeParse(JSON.parse(await readFile(DATA_FILE, 'utf8')))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid import file', issues: parsed.error.flatten() }, { status: 500 })

  let categoryIds: Map<string, string>
  try {
    categoryIds = await ensureCategories(parsed.data.categories)
  } catch (err) {
    console.error('[import etsy] categories', err)
    return NextResponse.json({ error: 'Failed to prepare categories' }, { status: 500 })
  }

  Object.assign(progress, {
    running: true, total: parsed.data.items.length, done: 0, created: 0, skipped: 0, images: 0,
    failed: [], startedAt: new Date().toISOString(), finishedAt: null,
  })
  void run(parsed.data.items, categoryIds)
  return NextResponse.json(progress, { status: 202 })
}
