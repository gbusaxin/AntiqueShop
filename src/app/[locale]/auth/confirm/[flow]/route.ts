import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabaseServer'
import { getSiteOrigin } from '@/lib/siteOrigin'
import { routing } from '@/i18n/routing'

/**
 * Landing route for links in Supabase auth emails (sign-up confirmation, password reset).
 * Supports both link styles:
 *  - token_hash + type (works on any device; used by custom email templates)
 *  - ?code= (PKCE; Supabase's default {{ .ConfirmationURL }} links)
 */
const DESTINATIONS = new Map<string, string>([
  ['signup', '/auth/verify'],
  ['recovery', '/auth/reset-password'],
])

const OTP_TYPES = new Set<EmailOtpType>(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'])

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string; flow: string }> }) {
  const { locale: rawLocale, flow } = await params
  const locale = (routing.locales as readonly string[]).includes(rawLocale) ? rawLocale : routing.defaultLocale
  const url = new URL(request.url)
  const destination = new URL(`/${locale}${DESTINATIONS.get(flow) ?? '/auth/verify'}`, getSiteOrigin(request))

  if (!url.searchParams.has('error')) {
    const supabase = await createClient()
    const tokenHash = url.searchParams.get('token_hash')
    const type = url.searchParams.get('type') as EmailOtpType | null
    const code = url.searchParams.get('code')

    if (tokenHash && type && OTP_TYPES.has(type)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (!error) return NextResponse.redirect(destination)
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(destination)
    }
  }

  destination.searchParams.set('error', 'invalid_link')
  return NextResponse.redirect(destination)
}
