import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabaseServer'
import { formatPrice } from '@/lib/getPriceForRegion'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale, Order } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account.orders' })
  return { title: `${t('title')} — VintagEmpire`, robots: { index: false, follow: false } }
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()

  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, created_at, status, total_eur, shipping_address, shipping_method, shipping_cost_eur, payment_provider, items:order_items(id, price_eur, quantity, product_snapshot, product:products(name_en, name_ru, name_de, images))')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) notFound()

  const order = data as unknown as Order
  const t = await getTranslations({ locale, namespace: 'account.orders' })
  const statusT = await getTranslations({ locale, namespace: 'orders.status' })
  const commonT = await getTranslations({ locale, namespace: 'common' })
  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  const address = order.shipping_address
  const addressLines = address ? [
    address.recipient_name,
    address.address_line_1,
    address.address_line_2,
    [address.postal_code, address.city].filter(Boolean).join(' '),
    address.state,
    address.country,
    address.recipient_phone,
  ].filter(Boolean) : []

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 text-[var(--fg)] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/account/orders" className="text-sm text-[var(--accent)] hover:underline">← {t('title')}</Link>
        <h1 className="mt-6 font-serif text-3xl text-[var(--accent)]">{t('orderNumber')} #{order.id.slice(0, 8).toUpperCase()}</h1>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--fg-muted)]">
          <span>{t('date')}: {new Intl.DateTimeFormat(localeStr, { dateStyle: 'long' }).format(new Date(order.created_at))}</span>
          <span>{t('status')}: {statusT.has(order.status) ? statusT(order.status) : t('unknownStatus')}</span>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section className="border border-[var(--border)] p-5 sm:p-7">
            <h2 className="mb-5 font-serif text-xl">{t('details.items')}</h2>
            <ul className="divide-y divide-[var(--border)]">
              {order.items?.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  {item.product?.images?.[0] && <Image src={item.product.images[0]} alt="" width={64} height={80} className="h-20 w-16 shrink-0 bg-[#F5F1EA] object-contain dark:bg-[#1F1B17]" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{(item.product && getLocalizedField(item.product as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)) || item.product_snapshot?.name || commonT('item')}</p>
                    <p className="mt-1 text-sm text-[var(--fg-muted)]">{t('details.quantity')}: {item.quantity}</p>
                    <p className="mt-1 text-sm">{formatPrice(item.price_eur, 'EUR', localeStr)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-[var(--border)] pt-4 font-medium">
              <span>{t('total')}</span>
              <span>{formatPrice(order.total_eur, 'EUR', localeStr)}</span>
            </div>
          </section>
          <div className="space-y-8">
            <section className="border border-[var(--border)] p-5 sm:p-7">
              <h2 className="mb-4 font-serif text-xl">{t('details.shippingAddress')}</h2>
              {addressLines.length ? <address className="space-y-1 text-sm not-italic text-[var(--fg-muted)]">{addressLines.map((line, index) => <p key={index}>{line}</p>)}</address> : <p className="text-sm text-[var(--fg-muted)]">{t('details.noAddress')}</p>}
              {order.shipping_method && <p className="mt-4 text-sm">{t('details.shippingMethod')}: {order.shipping_method === 'standard' ? t('details.standard') : order.shipping_method === 'express' ? t('details.express') : order.shipping_method}</p>}
              <p className="mt-2 text-sm">{t('details.shippingCost')}: {formatPrice(order.shipping_cost_eur, 'EUR', localeStr)}</p>
            </section>
            <section className="border border-[var(--border)] p-5 sm:p-7">
              <h2 className="mb-4 font-serif text-xl">{t('details.payment')}</h2>
              <p className="text-sm text-[var(--fg-muted)]">{order.payment_provider === 'stripe' ? 'Stripe' : order.payment_provider === 'yookassa' ? 'ЮKassa' : t('details.notSpecified')}</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
