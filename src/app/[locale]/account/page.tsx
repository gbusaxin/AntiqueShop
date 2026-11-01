import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabaseServer'
import { formatPrice } from '@/lib/getPriceForRegion'
import { AccountProfileForm } from '@/components/AccountProfileForm'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: `${t('title')} — VintagEmpire`, robots: { index: false, follow: false } }
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const t = await getTranslations({ locale, namespace: 'account' })
  const navT = await getTranslations({ locale, namespace: 'nav' })
  const statusT = await getTranslations({ locale, namespace: 'orders.status' })
  const localeStr = locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : 'en-GB'
  const [profileResult, ordersResult] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase.from('orders').select('id, created_at, total_eur, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])
  if (profileResult.error) throw profileResult.error
  if (ordersResult.error) throw ordersResult.error

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 text-[var(--fg)] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <nav aria-label={t('breadcrumbs')} className="mb-8 flex gap-2 text-sm text-[var(--fg-muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">{navT('home')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t('title')}</span>
        </nav>
        <h1 className="mb-10 font-serif text-3xl text-[var(--accent)] sm:text-4xl">{t('title')}</h1>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border border-[var(--border)] p-5 sm:p-8">
            <h2 className="mb-6 font-serif text-2xl">{t('profile.title')}</h2>
            <AccountProfileForm
              email={user.email ?? ''}
              name={profileResult.data?.full_name ?? (typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '')}
              phone={profileResult.data?.phone ?? ''}
              locale={locale}
            />
          </section>
          <section className="border border-[var(--border)] p-5 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{t('orders.title')}</h2>
              <Link href="/account/orders" className="text-sm text-[var(--accent)] underline underline-offset-4">{t('allOrders')} →</Link>
            </div>
            {!ordersResult.data?.length ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--fg-muted)]">{t('orders.empty')}</p>
                <Link href="/catalog" className="inline-block border border-[var(--accent)] px-5 py-3 text-sm text-[var(--accent)]">{t('orders.browseCatalog')}</Link>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {ordersResult.data.map((order) => (
                  <li key={order.id}>
                    <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-[var(--accent)]">
                      <div>
                        <span className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <p className="mt-1 text-sm text-[var(--fg-muted)]">{new Intl.DateTimeFormat(localeStr, { dateStyle: 'medium' }).format(new Date(order.created_at))}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatPrice(order.total_eur, 'EUR', localeStr)}</p>
                        <p className="text-[var(--fg-muted)]">{statusT.has(order.status) ? statusT(order.status) : t('orders.unknownStatus')}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
