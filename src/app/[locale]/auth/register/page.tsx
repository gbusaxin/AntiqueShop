import type { Metadata } from 'next'
import { RegisterClient } from '@/components/auth/RegisterClient'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

const TITLES: Record<string, string> = {
  en: 'Create Account — Belle Époque',
  ru: 'Регистрация — Belle Époque',
  de: 'Konto erstellen — Belle Époque',
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
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${BASE_URL}/${locale}/auth/register`,
      languages: {
        en: `${BASE_URL}/en/auth/register`,
        ru: `${BASE_URL}/ru/auth/register`,
        de: `${BASE_URL}/de/auth/register`,
        'x-default': `${BASE_URL}/en/auth/register`,
      },
    },
  }
}

export default function RegisterPage() {
  return <RegisterClient />
}
