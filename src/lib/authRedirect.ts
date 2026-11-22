export type AuthFlow = 'signup' | 'recovery'

/**
 * Where Supabase sends the user after clicking a link in an auth email.
 * Kept free of query parameters so an email template can append
 * `?token_hash={{ .TokenHash }}&type=...` to `{{ .RedirectTo }}`.
 * Must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function authRedirectUrl(locale: string, flow: AuthFlow): string {
  return `${window.location.origin}/${locale}/auth/confirm/${flow}`
}
