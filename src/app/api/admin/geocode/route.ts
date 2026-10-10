import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { z } from 'zod'
import { createClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const requestSchema = z.object({ address: z.string().trim().min(3).max(2000) }).strict()
const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
})
const resultSchema = z.array(z.object({
  lat: z.string().min(1).transform(Number).pipe(z.number().finite().min(-90).max(90)),
  lon: z.string().min(1).transform(Number).pipe(z.number().finite().min(-180).max(180)),
}))
type Location = z.infer<typeof locationSchema>

let redis: Redis | null = null
let nextRequestAt = 0
const cache = new Map<string, { location: Location; expires: number }>()

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '1' } : {}) },
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return respond({ error: 'Forbidden' }, 403)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return respond({ error: 'Forbidden' }, 403)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return respond({ error: 'Invalid JSON' }, 400)
  }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return respond({ error: 'Address must contain between 3 and 2000 characters' }, 400)

  const key = `geocode:cache:${createHash('sha256').update(parsed.data.address.toLowerCase()).digest('hex')}`
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return respond(cached.location)
  cache.delete(key)

  try {
    if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    }
    if (redis) {
      const sharedCache = locationSchema.safeParse(await redis.get(key))
      if (sharedCache.success) return respond(sharedCache.data)
      const acquired = await redis.set('geocode:nominatim:lock', '1', { nx: true, px: 1000 })
      if (!acquired) return respond({ error: 'Please wait one second before looking up another address' }, 429)
    } else if (process.env.NODE_ENV === 'production') {
      return respond({ error: 'Address lookup requires shared rate limiting. Please enter coordinates manually.' }, 503)
    }

    if (Date.now() < nextRequestAt) return respond({ error: 'Please wait one second before looking up another address' }, 429)
    nextRequestAt = Date.now() + 1000

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', parsed.data.address)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    const response = await fetch(url, {
      headers: {
        'User-Agent': `BelleEpoque-Contacts/1.0 (${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'})`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return respond({ error: 'Address lookup is temporarily unavailable. Please try again later.' }, response.status === 429 ? 429 : 502)
    const results = resultSchema.safeParse(await response.json())
    if (!results.success) return respond({ error: 'Invalid response from address lookup' }, 502)
    const result = results.data[0]
    if (!result) return respond({ error: 'Address not found. Try a more specific address or enter coordinates manually.' }, 404)
    const location = { latitude: result.lat, longitude: result.lon }
    if (redis) await redis.set(key, location, { ex: 86400 })
    if (cache.size >= 100) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
    cache.set(key, { location, expires: Date.now() + 86400000 })
    return respond(location)
  } catch {
    return respond({ error: 'Address lookup is temporarily unavailable. Please enter coordinates manually or try again later.' }, 503)
  }
}
