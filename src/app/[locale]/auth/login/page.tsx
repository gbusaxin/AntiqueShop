import type { Metadata } from 'next'
import { LoginClient } from '@/components/auth/LoginClient'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

const TITLES: Record<string, string> = {
  en: 'Sign In — Belle Époque',
  ru: 'Войти — Belle Époque',
  de: 'Anmelden — Belle Époque',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const title = TITLES[locale] ?? TITLES.en
  return {
    title,
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
