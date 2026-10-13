import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { LoginClient } from '@/components/auth/LoginClient'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })
  return {
    title: `${t('title')} — Belle Époque`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${BASE_URL}/${locale}/auth/login`,
      languages: {
        en: `${BASE_URL}/en/auth/login`,
        ru: `${BASE_URL}/ru/auth/login`,
        de: `${BASE_URL}/de/auth/login`,
        'x-default': `${BASE_URL}/en/auth/login`,
      },
    },
  }
}

export default function LoginPage() {
  return <LoginClient />
}
