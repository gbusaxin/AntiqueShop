import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseServer'
import { errorResponse, isAdmin, listCategories } from '../_shared'

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(10000),
}).strict().refine(({ ids }) => new Set(ids).size === ids.length, 'Category IDs must be unique')

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const categories = await listCategories()
    const byId = new Map(categories.map((category) => [category.id, category]))
    if (parsed.data.ids.length !== categories.length || parsed.data.ids.some((id) => !byId.has(id))) {
      return NextResponse.json({ error: 'Categories have changed. Refresh the list before reordering.' }, { status: 409 })
    }

    const client = createAdminClient()
    const updatedAt = new Date().toISOString()
    const changed: { category: (typeof categories)[number]; updatedAt: string }[] = []
    try {
      for (const [sortOrder, id] of parsed.data.ids.entries()) {
        const category = byId.get(id)!
        if (category.sort_order === sortOrder) continue
        let query = client.from('categories').update({ sort_order: sortOrder, updated_at: updatedAt })
          .eq('id', id).eq('sort_order', category.sort_order)
        query = category.updated_at === null
          ? query.is('updated_at', null)
          : query.eq('updated_at', category.updated_at)
        const { data, error } = await query.select('id, updated_at').maybeSingle()
        if (error) throw error
        if (!data) throw new Error('Categories changed while saving. Refresh and try again.')
        changed.push({ category, updatedAt: data.updated_at })
      }
    } catch (error) {
      for (const { category, updatedAt: savedAt } of changed.reverse()) {
        const { error: rollbackError } = await client.from('categories')
          .update({ sort_order: category.sort_order, updated_at: category.updated_at })
          .eq('id', category.id).eq('updated_at', savedAt)
        if (rollbackError) console.error('[admin categories reorder rollback]', rollbackError)
      }
      if (error instanceof Error && error.message === 'Categories changed while saving. Refresh and try again.') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ categories: await listCategories() })
  } catch (error) {
    const failure = errorResponse(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
}
