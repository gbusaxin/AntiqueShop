import { createAdminClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'
import type { OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'admin-status-blue',
  paid: 'admin-status-green',
  shipped: 'admin-status-amber',
  completed: 'admin-status-green',
  cancelled: 'admin-status-red',
  refunded: 'admin-status-red',
}

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        id, quantity, price_eur, product_snapshot,
        products(name_en, name_ru, images)
      )
    `
    )
    .eq('id', id)
    .single()

  if (!order) notFound()

  const address = order.shipping_address as Record<string, string> | null

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[11px] text-[var(--admin-accent-text)] transition-colors hover:text-[var(--admin-accent-text)]"
        >
          <ChevronLeft size={14} />
          Back
        </Link>
        <h1 className="font-serif text-2xl text-[var(--fg)] sm:text-3xl">
          Order #{id.slice(0, 8).toUpperCase()}
        </h1>
        <span className={`text-xs font-medium uppercase ${STATUS_COLORS[order.status as OrderStatus]}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6">
            <h2 className="admin-section mb-4">Items</h2>
            <div className="space-y-4">
              {(order.order_items ?? []).map(
                (item: {
                  id: string
                  quantity: number
                  price_eur: number
                  product_snapshot: { name: string; price_eur: number } | null
                  products: { name_en: string | null; name_ru: string | null; images: string[] } | null
                }) => {
                  const name =
                    item.products?.name_en ??
                    item.products?.name_ru ??
                    item.product_snapshot?.name ??
                    'Unknown'
                  const image = item.products?.images?.[0]
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      {image ? (
                        <Image src={image} alt={name} width={64} height={64} className="h-16 w-16 object-cover" />
                      ) : (
                        <div className="h-16 w-16 bg-[var(--accent)]/10" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-[var(--fg)]">{name}</p>
                        <p className="text-xs text-[var(--fg-muted)]">qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm text-[var(--admin-accent-text)]">€{Number(item.price_eur).toFixed(2)}</p>
                    </div>
                  )
                }
              )}
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-4 text-right">
              <p className="text-xs text-[var(--fg-muted)]">Shipping: €{Number(order.shipping_cost_eur).toFixed(2)}</p>
              <p className="mt-1 font-serif text-lg text-[var(--admin-accent-text)]">
                Total: €{Number(order.total_eur).toFixed(2)}
              </p>
              {order.total_local && (
                <p className="text-xs text-[var(--fg-muted)]">
                  ≈ {order.currency} {Number(order.total_local).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {address && (
            <div className="admin-card p-6">
              <h2 className="admin-section mb-4">Shipping Address</h2>
              <div className="space-y-1 text-xs text-[var(--fg)]">
                {Object.entries(address).map(([k, v]) =>
                  v ? (
                    <p key={k}>
                      <span className="text-[var(--fg-muted)] capitalize">{k.replace(/_/g, ' ')}:</span> {v}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="admin-card p-6">
            <h2 className="admin-section mb-4">Payment</h2>
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-[var(--fg-muted)]">Provider:</span>{' '}
                <span className="capitalize text-[var(--fg)]">{order.payment_provider ?? '—'}</span>
              </p>
              <p>
                <span className="text-[var(--fg-muted)]">Region:</span>{' '}
                <span className="text-[var(--fg)]">{order.region}</span>
              </p>
              <p>
                <span className="text-[var(--fg-muted)]">Session ID:</span>{' '}
                <span className="break-all font-mono text-[10px] text-[var(--fg-muted)]">
                  {order.payment_session_id ?? '—'}
                </span>
              </p>
              <p>
                <span className="text-[var(--fg-muted)]">Created:</span>{' '}
                <span className="text-[var(--fg)]">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="admin-section mb-4">Update Status</h2>
            <OrderStatusForm orderId={id} currentStatus={order.status as OrderStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}
