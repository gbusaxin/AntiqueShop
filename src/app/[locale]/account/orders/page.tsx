import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabaseServer'
import { formatPrice } from '@/lib/getPriceForRegion'
import { getLocalizedField } from '@/lib/getLocalizedField'
import type { Locale, Order } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account.orders' })
  return { title: `${t('title')} — VintagEmpire`, robots: { index: false, follow: false } }
}

const STATUS_STYLES: Record<string, string> = {
  new: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  paid: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  shipped: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  completed: 'text-gold-rich border-gold/30 bg-gold/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
  refunded: 'text-red-400 border-red-400/30 bg-red-400/5',
}

export default async function AccountOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam && /^\d{1,6}$/.test(pageParam) ? Math.max(1, Number(pageParam)) : 1
  const pageSize = 10
  const t = await getTranslations({ locale, namespace: 'account.orders' })
  const statusT = await getTranslations({ locale, namespace: 'orders.status' })
  const navT = await getTranslations({ locale, namespace: 'nav' })
  const commonT = await getTranslations({ locale, namespace: 'common' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const { data: orders, count, error } = await supabase
    .from('orders')
    .select('id, created_at, total_eur, status, items:order_items(id, price_eur, quantity, product_snapshot, product:products(name_en, name_ru, name_de, images))', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw error

  const typedOrders = (orders ?? []) as unknown as Order[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))
  if (page > totalPages) redirect(`/${locale}/account/orders?page=${totalPages}`)
  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">{navT('account')}</p>
          <h1 className="mt-2 font-serif text-3xl text-gold-rich">{t('title')}</h1>
        </div>

        {!typedOrders.length ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <p className="font-serif text-xl text-gold/40">{t('empty')}</p>
            <Link
              href="/catalog"
              className="border border-gold/30 px-8 py-3 text-xs uppercase tracking-[0.2em] text-gold/70 transition-colors hover:border-gold hover:text-gold-rich"
            >
              {t('browseCatalog')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {typedOrders.map((order) => (
              <div key={order.id} className="border border-gold/15 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gold/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50">
                      {t('orderNumber')}
                    </p>
                    <p className="mt-1 font-mono text-sm text-[#f4ead1]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50">
                      {t('date')}
                    </p>
                    <p className="mt-1 text-xs text-[#c8bfaa]/70">
                      {new Intl.DateTimeFormat(localeStr, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(order.created_at))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50">
                      {t('total')}
                    </p>
                    <p className="mt-1 font-serif text-base text-gold-rich">
                      {formatPrice(order.total_eur, 'EUR', localeStr)}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span
                      className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        STATUS_STYLES[order.status] ?? 'text-gold/50 border-gold/20'
                      }`}
                    >
                      {statusT.has(order.status) ? statusT(order.status) : t('unknownStatus')}
                    </span>
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.product?.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt=""
                            width={40}
                            height={48}
                            className="h-12 w-10 bg-[#1F1B17] object-contain opacity-80"
                          />
                        )}
                        <div>
                          <p className="text-[10px] text-[#c8bfaa]/60 line-clamp-1">
                            {(item.product && getLocalizedField(item.product as unknown as Record<string, string | null | undefined>, 'name', locale as Locale)) || item.product_snapshot?.name || commonT('item')}
                          </p>
                          <p className="text-[10px] text-gold/50">
                            {formatPrice(item.price_eur, 'EUR', localeStr)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="self-center text-[10px] text-gold/40">
                        {t('moreItems', { count: order.items.length - 3 })}
                      </p>
                    )}
                  </div>
                )}
                <Link href={`/account/orders/${order.id}`} className="mt-4 inline-block text-sm text-gold-rich underline underline-offset-4 hover:text-gold">
                  {t('viewDetails')} →
                </Link>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <nav aria-label={t('pagination')} className="mt-8 flex items-center justify-center gap-4 text-sm">
            {page > 1 && <Link href={`/account/orders?page=${page - 1}`} className="text-gold-rich hover:underline">← {t('previous')}</Link>}
            <span>{t('pageOf', { page, total: totalPages })}</span>
            {page < totalPages && <Link href={`/account/orders?page=${page + 1}`} className="text-gold-rich hover:underline">{t('next')} →</Link>}
          </nav>
        )}
      </div>
    </div>
  )
}
