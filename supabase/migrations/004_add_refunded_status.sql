-- Allow refunded orders so payment webhooks and admin updates can persist the status.
DO $$
BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'));
END $$;
