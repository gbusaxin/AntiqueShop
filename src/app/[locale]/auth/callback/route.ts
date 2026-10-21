import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const url = new URL(request.url)
  const next = url.searchParams.get('next') === '/auth/reset-password' ? '/auth/reset-password' : '/auth/verify'
  const origin = process.env.NODE_ENV === 'development'
    ? url.origin
    : process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://vintageempire.com'
  const destination = new URL(`/${locale}${next}`, origin)
  const code = url.searchParams.get('code')

  if (code && !url.searchParams.has('error')) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(destination)
  }

  destination.searchParams.set('error', 'invalid_link')
  return NextResponse.redirect(destination)
}
