import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface InMemoryEntry {
  count: number
  resetAt: number
}

const inMemoryStore = new Map<string, InMemoryEntry>()

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = inMemoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

let redis: Redis | null = null
let contactLimiter: Ratelimit | null = null
let checkoutLimiter: Ratelimit | null = null
let authLimiter: Ratelimit | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    } catch {
      return null
    }
  }
  return redis
}

function getContactLimiter(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!contactLimiter) {
    contactLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      prefix: 'rl:contact',
    })
  }
  return contactLimiter
}

function getCheckoutLimiter(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!checkoutLimiter) {
    checkoutLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:checkout',
    })
  }
  return checkoutLimiter
}

function getAuthLimiter(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'rl:auth',
    })
  }
  return authLimiter
}

function getLimiterForKey(key: string): Ratelimit | null {
  if (key.startsWith('contact:')) return getContactLimiter()
  if (key.startsWith('checkout:')) return getCheckoutLimiter()
  if (key.startsWith('auth:')) return getAuthLimiter()
  return null
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const limiter = getLimiterForKey(key)

  if (!limiter) {
    return inMemoryRateLimit(key, maxRequests, windowMs)
  }

  try {
    const { success, reset } = await limiter.limit(key)
    const retryAfter = success ? 0 : Math.ceil((reset - Date.now()) / 1000)
    return { allowed: success, retryAfter }
  } catch {
    return inMemoryRateLimit(key, maxRequests, windowMs)
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
