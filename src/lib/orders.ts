// Server-only order lifecycle shared by the checkout routes and the payment webhooks.
import { createAdminClient } from '@/lib/supabaseServer'
import { sendOrderConfirmation, notifyAdminNewOrder } from '@/lib/email'

type AdminClient = ReturnType<typeof createAdminClient>

/** How long a piece stays held while the buyer is on the payment page (Stripe sessions live 30 min) */
export const CHECKOUT_HOLD_MINUTES = 35
/** SEPA Direct Debit settles in up to 14 business days; the piece stays held until then */
export const ASYNC_PAYMENT_HOLD_DAYS = 21

const OPEN_STATUSES = ['new', 'awaiting_payment']
// Money that actually arrived wins over our own cancellation (e.g. a late SBP payment)
const PAYABLE_STATUSES = [...OPEN_STATUSES, 'cancelled']

/** Holds every product for the order, or none. False when somebody else is paying for one of them. */
export async function reserveProducts(supabase: AdminClient, orderId: string, productIds: string[]): Promise<boolean> {
  const expiresAt = new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60_000).toISOString()
  const { data, error } = await supabase.rpc('reserve_products', {
    p_order_id: orderId,
    p_product_ids: productIds,
    p_expires_at: expiresAt,
  })
  if (error) {
    console.error('[orders] reserve_products failed', error)
    return false
  }
  return data === true
}

/** Cancels an unpaid order and frees its pieces. No-op for orders that are already paid. */
export async function cancelOrder(supabase: AdminClient, orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .in('status', OPEN_STATUSES)
  if (error) console.error('[orders] cancel failed', orderId, error)
  await supabase.from('product_reservations').delete().eq('order_id', orderId)
}

/** The buyer confirmed an asynchronous payment (SEPA): keep the pieces held until the money arrives. */
export async function markAwaitingPayment(supabase: AdminClient, orderId: string, paymentId: string | null) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'awaiting_payment', payment_intent_id: paymentId, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'new')
  if (error) throw error

  const holdUntil = new Date(Date.now() + ASYNC_PAYMENT_HOLD_DAYS * 86_400_000).toISOString()
  await supabase.from('product_reservations').update({ expires_at: holdUntil }).eq('order_id', orderId)
}

/**
 * Marks the order paid, takes its pieces off sale and e-mails the buyer and the shop.
 * Idempotent: only an open order is updated, so a repeated webhook sends nothing twice.
 */
export async function markOrderPaid(
  supabase: AdminClient,
  orderId: string,
  paymentId: string | null,
  fallbackLocale: string
): Promise<void> {
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'paid', payment_intent_id: paymentId, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .in('status', PAYABLE_STATUSES)
    .select('id, email, total_eur, region, payment_provider, locale, order_items(product_id, quantity, price_eur, products(name_en, name_ru, name_de))')
    .maybeSingle()

  if (error) throw error
  if (!order) return

  const orderItems = (order.order_items ?? []) as {
    product_id: string | null
    quantity: number
    price_eur: number
    products: { name_en?: string; name_ru?: string; name_de?: string } | null
  }[]

  // Every piece is one of a kind: once paid it leaves the shop window
  const productIds = orderItems.map((i) => i.product_id).filter((id): id is string => Boolean(id))
  if (productIds.length) {
    const { error: soldError } = await supabase
      .from('products')
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .in('id', productIds)
    if (soldError) console.error('[orders] failed to mark products sold', orderId, soldError)
  }
  await supabase.from('product_reservations').delete().eq('order_id', orderId)

  const locale = (order.locale as string | null) ?? fallbackLocale
  const localName = (p: { name_en?: string; name_ru?: string; name_de?: string } | null) =>
    (locale === 'ru' ? p?.name_ru : locale === 'de' ? p?.name_de : p?.name_en) ?? p?.name_en ?? p?.name_ru
  const items = orderItems.map((i) => ({
    name: localName(i.products) ?? 'Item',
    quantity: i.quantity,
    priceEur: i.price_eur,
  }))

  await Promise.all([
    order.email
      ? sendOrderConfirmation({
          to: order.email as string,
          orderNumber: order.id as string,
          items,
          totalEur: order.total_eur as number,
          locale,
        })
      : Promise.resolve(),
    notifyAdminNewOrder({
      orderNumber: order.id as string,
      totalEur: order.total_eur as number,
      region: order.region as string,
      provider: order.payment_provider as string,
      customerEmail: (order.email as string | null) ?? '',
    }),
  ])
}
