import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactsClient } from '@/components/contacts/ContactsClient'
import { createClient } from '@/lib/supabaseServer'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale } from '@/types'
import { getSiteContent } from '@/components/SiteContentPage'
import { ContentText, contentPlaceholder, localizedContent } from '@/components/admin/MarkdownEditor'
import { pageMetadata } from '@/lib/seo'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const [nav, seo] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'seo' }),
  ])
  return pageMetadata({ locale, path: '/contacts', title: nav('contacts'), description: seo('contactsDescription') })
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
