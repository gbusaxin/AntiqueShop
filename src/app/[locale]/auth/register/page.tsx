import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { RegisterClient } from '@/components/auth/RegisterClient'
import { pageMetadata } from '@/lib/seo'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.register' })
  return pageMetadata({ locale, path: '/auth/register', title: t('title'), noindex: true })
}

export default function RegisterPage() {
  return <RegisterClient />
}
