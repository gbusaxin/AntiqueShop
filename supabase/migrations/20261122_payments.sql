-- Payments: reservations for unique pieces, asynchronous payments (SEPA), chosen payment method.
-- Idempotent: safe to run more than once. Mirrors the same changes in supabase/init.sql.
BEGIN;

-- 1. Orders: new status for payments that are confirmed by the buyer but not settled yet (SEPA Direct Debit)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'awaiting_payment', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'));

-- 2. Orders: the method the buyer picked on the checkout page (card, sepa, klarna, sbp, ...)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 3. Reservations: a piece in checkout can't be bought by somebody else at the same time
CREATE TABLE IF NOT EXISTS public.product_reservations (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_reservations_order ON public.product_reservations(order_id);
-- RLS on, no policies: only the service role (server) can read or write reservations
ALTER TABLE public.product_reservations ENABLE ROW LEVEL SECURITY;

-- Reserves every product for the order, or none of them. Returns false if any piece is already held.
CREATE OR REPLACE FUNCTION public.reserve_products(
  p_order_id UUID,
  p_product_ids UUID[],
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wanted INT;
  reserved INT;
BEGIN
  SELECT count(DISTINCT pid) INTO wanted FROM unnest(p_product_ids) AS pid;

  DELETE FROM product_reservations
  WHERE product_id = ANY (p_product_ids) AND expires_at < now();

  INSERT INTO product_reservations (product_id, order_id, expires_at)
  SELECT DISTINCT pid, p_order_id, p_expires_at FROM unnest(p_product_ids) AS pid
  ON CONFLICT (product_id) DO NOTHING;
  GET DIAGNOSTICS reserved = ROW_COUNT;

  IF reserved < wanted THEN
    DELETE FROM product_reservations WHERE order_id = p_order_id;
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_products(UUID, UUID[], TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_products(UUID, UUID[], TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_products(UUID, UUID[], TIMESTAMPTZ) TO service_role;

COMMIT;
