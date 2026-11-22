import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getSiteOrigin } from '@/lib/siteOrigin'

// Legacy landing route for links sent before /auth/confirm/[flow] existed

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const url = new URL(request.url)
  const next = url.searchParams.get('next') === '/auth/reset-password' ? '/auth/reset-password' : '/auth/verify'
  const destination = new URL(`/${locale}${next}`, getSiteOrigin(request))
  const code = url.searchParams.get('code')

  if (code && !url.searchParams.has('error')) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(destination)
  }

  destination.searchParams.set('error', 'invalid_link')
  return NextResponse.redirect(destination)
}
