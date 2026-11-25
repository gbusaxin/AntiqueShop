import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { LoginClient } from '@/components/auth/LoginClient'
import { pageMetadata } from '@/lib/seo'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })
  return pageMetadata({ locale, path: '/auth/login', title: t('title'), noindex: true })
}

export default function LoginPage() {
  return <LoginClient />
}
