import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './src/i18n/routing'
import { updateSupabaseSession } from './src/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    return updateSupabaseSession(request)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/', '/(ru|en|de)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
