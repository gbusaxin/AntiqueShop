CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_all"    ON public.products;
DROP POLICY IF EXISTS "products_write_admin"   ON public.products;
DROP POLICY IF EXISTS "categories_select_all"  ON public.categories;
DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
DROP POLICY IF EXISTS "orders_select"          ON public.orders;
DROP POLICY IF EXISTS "orders_insert_auth"     ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin"    ON public.orders;
DROP POLICY IF EXISTS "order_items_select"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert"     ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin"      ON public.order_items;
DROP POLICY IF EXISTS "profiles_select"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;
DROP POLICY IF EXISTS "site_content_select"    ON public.site_content;
DROP POLICY IF EXISTS "site_content_write"     ON public.site_content;
DROP POLICY IF EXISTS "contact_requests_insert" ON public.contact_requests;
DROP POLICY IF EXISTS "contact_requests_admin"  ON public.contact_requests;
DROP POLICY IF EXISTS "exchange_rates_select"   ON public.exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_write"    ON public.exchange_rates;

CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  USING (is_available = true OR public.is_admin());

CREATE POLICY "products_write_admin"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "categories_write_admin"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "orders_insert_auth"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "order_items_select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
        AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "order_items_admin"
  ON public.order_items FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "site_content_select"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "site_content_write"
  ON public.site_content FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_requests_insert"
  ON public.contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_requests_admin"
  ON public.contact_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "exchange_rates_select"
  ON public.exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "exchange_rates_write"
  ON public.exchange_rates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available   ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created     ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created       ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
