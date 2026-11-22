/**
 * Public origin of the site for server-side redirects (auth links, callbacks).
 *
 * Behind Railway's proxy `request.url` points at the container (http://localhost:3000),
 * so the origin is taken from X-Forwarded-Host/Proto — but only when it matches a
 * configured origin, so a forged header cannot redirect users elsewhere. Localhost is
 * never used outside development.
 */
function toOrigin(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin
  } catch {
    return null
  }
}

const isLocal = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$)/.test(origin)

export function getSiteOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin
  if (process.env.NODE_ENV === 'development') return requestOrigin

  const configured = [
    toOrigin(process.env.RAILWAY_PUBLIC_DOMAIN),
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    toOrigin(process.env.NEXT_PUBLIC_BASE_URL),
  ].filter((origin): origin is string => Boolean(origin) && !isLocal(origin as string))

  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  if (host) {
    const candidate = toOrigin(`${proto}://${host}`)
    if (candidate && configured.includes(candidate)) return candidate
  }

  return configured[0] ?? 'https://vintageempire.com'
}
