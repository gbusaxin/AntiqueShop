import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactsClient } from '@/components/contacts/ContactsClient'
import { createClient } from '@/lib/supabaseServer'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale } from '@/types'
import { getSiteContent } from '@/components/SiteContentPage'
import { ContentText, contentPlaceholder, localizedContent } from '@/components/admin/MarkdownEditor'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vintageempire.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const titles: Record<string, string> = {
    en: 'Contact Us — VintagEmpire',
    ru: 'Контакты — VintagEmpire',
    de: 'Kontakt — VintagEmpire',
  }
  const descs: Record<string, string> = {
    en: 'Visit our galleries in Vienna and Berlin or send us a message. Our specialists are happy to assist.',
    ru: 'Посетите наши галереи в Вене и Берлине или напишите нам. Наши специалисты всегда рады помочь.',
    de: 'Besuchen Sie unsere Galerien in Wien und Berlin oder schreiben Sie uns. Unsere Spezialisten helfen gerne.',
  }

  return {
    title: locale === 'ru' ? titles.ru : locale === 'de' ? titles.de : titles.en,
    description: locale === 'ru' ? descs.ru : locale === 'de' ? descs.de : descs.en,
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
      title: locale === 'ru' ? titles.ru : locale === 'de' ? titles.de : titles.en,
      description: locale === 'ru' ? descs.ru : locale === 'de' ? descs.de : descs.en,
      siteName: 'VintagEmpire',
    },
  }
}

/** "Ask about this piece" deep link: /contacts?item=<SKU> pre-fills the message with the product name. */
async function getItemPrefill(locale: string, sku: string | undefined): Promise<string | undefined> {
  if (!sku || !/^\d{7}$/.test(sku)) return undefined
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('sku, name_ru, name_en, name_de')
    .eq('sku', sku)
    .eq('is_available', true)
    .maybeSingle()
  if (!data) return undefined
  const t = await getTranslations({ locale, namespace: 'contacts' })
  const name = getLocalizedField(data as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)
  return t('form.itemPrefill', { name, sku: data.sku })
}

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const [item, defaultMessage] = await Promise.all([
    getSiteContent('contacts'),
    getItemPrefill(locale, typeof sp.item === 'string' ? sp.item : undefined),
  ])
  const defaultTitle = locale === 'ru' ? 'Контакты' : locale === 'de' ? 'Kontakt' : 'Contact Us'
  return (
    <ContactsClient
      locale={locale}
      title={localizedContent(item, locale, 'title') || defaultTitle}
      content={<ContentText content={localizedContent(item, locale, 'content') || contentPlaceholder(locale)} />}
      metadata={item?.metadata ?? {}}
      defaultMessage={defaultMessage}
    />
  )
}
