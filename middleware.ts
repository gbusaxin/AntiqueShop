import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'
import { routing } from './src/i18n/routing'
import { updateSupabaseSession } from './src/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

const INTERNAL_HEADERS = [
  'x-middleware-subrequest',
  'x-middleware-invoke',
  'x-invoke-path',
  'x-invoke-query',
  'x-invoke-output',
]

function stripInternalHeaders(request: NextRequest): NextRequest {
  const headers = new Headers(request.headers)
  let stripped = false
  for (const h of INTERNAL_HEADERS) {
    if (headers.has(h)) {
      headers.delete(h)
      stripped = true
    }
  }
  if (!stripped) return request
  return new NextRequest(request.url, { method: request.method, headers, body: request.body })
}

export default async function middleware(request: NextRequest) {
  const safeRequest = stripInternalHeaders(request)
  const { pathname } = safeRequest.nextUrl

  if (pathname.startsWith('/admin')) {
    return updateSupabaseSession(safeRequest)
  }

  const supabaseResponse = await updateSupabaseSession(safeRequest)

  const intlResponse = intlMiddleware(safeRequest)

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: ['/', '/(ru|en|de)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
