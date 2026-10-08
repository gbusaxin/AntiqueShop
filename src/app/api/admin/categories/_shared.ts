import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabaseServer'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform((value) => value || null)

export const categorySchema = z.object({
  slug: z.string().trim().toLowerCase().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens')
    .refine((value) => !value.startsWith('-') && !value.endsWith('-') && !value.includes('--'), 'Separate slug words with single hyphens'),
  name_ru: z.string().trim().min(1).max(200),
  name_en: z.string().trim().min(1).max(200),
  name_de: optionalText(200),
  description_ru: optionalText(5000),
  description_en: optionalText(5000),
  description_de: optionalText(5000),
  image_url: z.union([z.string().trim().url().refine((url) => url.startsWith('https://'), 'Use an HTTPS URL'), z.literal(''), z.null()]).optional().transform((value) => value || null),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(1000000).optional(),
}).strict()

export async function isAdmin() {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return false
  const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return !profileError && profile?.role === 'admin'
}

export async function listCategories() {
  const client = createAdminClient()
  const categories = []
  let offset = 0
  while (true) {
    const { data, error } = await client.from('categories')
      .select('id, slug, name_ru, name_en, name_de, description_ru, description_en, description_de, image_url, sort_order, is_active, created_at, updated_at, products(count)')
      .order('sort_order', { ascending: true }).order('id', { ascending: true }).range(offset, offset + 999)
    if (error) throw error
    for (const { products, ...category } of data ?? []) {
      categories.push({ ...category, product_count: products?.[0]?.count ?? 0 })
    }
    if (!data || data.length < 1000) break
    offset += 1000
  }

  return categories
}

export function errorResponse(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) {
    if (error.code === '23505') return { error: 'This slug is already in use', status: 409 }
    if (error.code === '23503') return { error: 'This category is still used by products', status: 409 }
  }
  console.error('[admin categories]', error)
  return { error: 'Unable to complete this request', status: 500 }
}
