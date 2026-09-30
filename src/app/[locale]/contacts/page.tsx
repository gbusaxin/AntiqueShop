import type { Metadata } from 'next'
import { ContactsClient } from '@/components/contacts/ContactsClient'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://belle-epoque.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const titles: Record<string, string> = {
    en: 'Contact Us — Belle Époque',
    ru: 'Контакты — Belle Époque',
    de: 'Kontakt — Belle Époque',
  }
  const descs: Record<string, string> = {
    en: 'Visit our galleries in Vienna and Berlin or send us a message. Our specialists are happy to assist.',
    ru: 'Посетите наши галереи в Вене и Берлине или напишите нам. Наши специалисты всегда рады помочь.',
    de: 'Besuchen Sie unsere Galerien in Wien und Berlin oder schreiben Sie uns. Unsere Spezialisten helfen gerne.',
  }

  return {
    title: titles[locale] ?? titles.en,
    description: descs[locale] ?? descs.en,
    alternates: {
      canonical: `${BASE_URL}/${locale}/contacts`,
      languages: {
        en: `${BASE_URL}/en/contacts`,
        ru: `${BASE_URL}/ru/contacts`,
        de: `${BASE_URL}/de/contacts`,
        'x-default': `${BASE_URL}/en/contacts`,
      },
    },
    openGraph: {
      type: 'website',
      url: `${BASE_URL}/${locale}/contacts`,
      title: titles[locale] ?? titles.en,
      description: descs[locale] ?? descs.en,
      siteName: 'Belle Époque',
    },
  }
}

export default function ContactsPage() {
  return <ContactsClient />
}
