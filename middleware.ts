import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './src/i18n/routing'
import { updateSupabaseSession } from './src/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    return updateSupabaseSession(request)
  }

  const supabaseResponse = await updateSupabaseSession(request)

  const intlResponse = intlMiddleware(request)

  if (intlResponse instanceof NextResponse && intlResponse.status !== 200) {
    return intlResponse
  }

  if (intlResponse.headers.get('location')) {
    const redirectResponse = NextResponse.redirect(
      new URL(intlResponse.headers.get('location')!, request.url)
    )
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: ['/', '/(ru|en|de)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
