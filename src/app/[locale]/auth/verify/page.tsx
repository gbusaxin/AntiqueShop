import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const t = await getTranslations('auth.verify')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const confirmed = !error && !!user?.email_confirmed_at

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="font-serif text-2xl text-foreground">{confirmed ? t('successTitle') : t('title')}</h1>
        <p role={error ? 'alert' : 'status'} className="text-sm text-muted-foreground">{error ? t('invalidLink') : confirmed ? t('success') : t('checkEmail')}</p>
        <Link href={confirmed ? '/' : '/auth/login'} className="inline-block text-sm text-foreground underline">{confirmed ? t('goHome') : t('backToLogin')}</Link>
      </div>
    </div>
  )
}
