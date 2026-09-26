import { createAdminClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'
import type { OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'text-blue-400',
  paid: 'text-emerald-400',
  shipped: 'text-amber-400',
  completed: 'text-green-400',
  cancelled: 'text-red-400',
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
          className="flex items-center gap-1 text-[11px] text-[#c9a84c]/50 transition-colors hover:text-[#c9a84c]"
        >
          <ChevronLeft size={14} />
          Back
        </Link>
        <h1 className="font-serif text-2xl text-[#c9a84c]">
          Order #{id.slice(0, 8).toUpperCase()}
        </h1>
        <span className={`text-xs font-medium uppercase ${STATUS_COLORS[order.status as OrderStatus]}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#c9a84c]/20 p-6">
            <h2 className="mb-4 text-[10px] uppercase tracking-widest text-[#c9a84c]/50">Items</h2>
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
                        <img src={image} alt={name} className="h-16 w-16 object-cover" />
                      ) : (
                        <div className="h-16 w-16 bg-[#c9a84c]/10" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-[#f4ead1]/80">{name}</p>
                        <p className="text-xs text-[#f4ead1]/40">qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm text-[#c9a84c]">€{Number(item.price_eur).toFixed(2)}</p>
                    </div>
                  )
                }
              )}
            </div>
            <div className="mt-4 border-t border-[#c9a84c]/15 pt-4 text-right">
              <p className="text-xs text-[#f4ead1]/40">Shipping: €{Number(order.shipping_cost_eur).toFixed(2)}</p>
              <p className="mt-1 font-serif text-lg text-[#c9a84c]">
                Total: €{Number(order.total_eur).toFixed(2)}
              </p>
              {order.total_local && (
                <p className="text-xs text-[#f4ead1]/40">
                  ≈ {order.currency} {Number(order.total_local).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {address && (
            <div className="border border-[#c9a84c]/20 p-6">
              <h2 className="mb-4 text-[10px] uppercase tracking-widest text-[#c9a84c]/50">Shipping Address</h2>
              <div className="space-y-1 text-xs text-[#f4ead1]/70">
                {Object.entries(address).map(([k, v]) =>
                  v ? (
                    <p key={k}>
                      <span className="text-[#f4ead1]/40 capitalize">{k.replace(/_/g, ' ')}:</span> {v}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-[#c9a84c]/20 p-6">
            <h2 className="mb-4 text-[10px] uppercase tracking-widest text-[#c9a84c]/50">Payment</h2>
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-[#f4ead1]/40">Provider:</span>{' '}
                <span className="capitalize text-[#f4ead1]/70">{order.payment_provider ?? '—'}</span>
              </p>
              <p>
                <span className="text-[#f4ead1]/40">Region:</span>{' '}
                <span className="text-[#f4ead1]/70">{order.region}</span>
              </p>
              <p>
                <span className="text-[#f4ead1]/40">Session ID:</span>{' '}
                <span className="break-all font-mono text-[10px] text-[#f4ead1]/40">
                  {order.payment_session_id ?? '—'}
                </span>
              </p>
              <p>
                <span className="text-[#f4ead1]/40">Created:</span>{' '}
                <span className="text-[#f4ead1]/70">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          <div className="border border-[#c9a84c]/20 p-6">
            <h2 className="mb-4 text-[10px] uppercase tracking-widest text-[#c9a84c]/50">Update Status</h2>
            <OrderStatusForm orderId={id} currentStatus={order.status as OrderStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}
