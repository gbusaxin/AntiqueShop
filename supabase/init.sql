BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ru TEXT,
  name_en TEXT,
  name_de TEXT,
  description_ru TEXT,
  description_en TEXT,
  description_de TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ru TEXT,
  name_en TEXT,
  name_de TEXT,
  description_ru TEXT,
  description_en TEXT,
  provenance_ru TEXT,
  provenance_en TEXT,
  provenance_de TEXT,
  era TEXT,
  material TEXT,
  country_of_origin TEXT,
  condition TEXT CHECK (condition IN ('excellent', 'very_good', 'good', 'fair')),
  year_circa TEXT,
  price_eur DECIMAL(10,2) NOT NULL,
  price_override JSONB,
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  region TEXT NOT NULL,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'yookassa', 'cloudpayments')),
  payment_session_id TEXT,
  payment_intent_id TEXT,
  currency TEXT NOT NULL,
  total_eur DECIMAL(10,2) NOT NULL,
  total_local DECIMAL(10,2),
  exchange_rate DECIMAL(10,6),
  shipping_address JSONB,
  shipping_method TEXT,
  shipping_cost_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot JSONB,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_eur DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  content_ru TEXT,
  content_en TEXT,
  content_de TEXT,
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page, section)
);

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  locale TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  rates JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_session ON public.orders(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at DESC);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'customer', NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_views(product_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE slug = product_slug AND is_available = true;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_views(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_views(TEXT) TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_update_updated_at ON public.profiles;
CREATE TRIGGER profiles_update_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS products_update_updated_at ON public.products;
CREATE TRIGGER products_update_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS orders_update_updated_at ON public.orders;
CREATE TRIGGER orders_update_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'customer', raw_user_meta_data ->> 'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE policy RECORD;
BEGIN
  FOR policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(ARRAY[
        'profiles', 'categories', 'products', 'orders', 'order_items',
        'site_content', 'contact_requests', 'exchange_rates', 'webhook_events'
      ])
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy.policyname, policy.schemaname, policy.tablename);
  END LOOP;
END $$;

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY categories_read ON public.categories FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY categories_admin_write ON public.categories FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY products_read ON public.products FOR SELECT TO anon, authenticated
  USING (is_available OR (SELECT public.is_admin()));
CREATE POLICY products_admin_write ON public.products FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY orders_read ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY orders_admin_write ON public.orders FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY order_items_read ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
      AND (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  ));
CREATE POLICY order_items_admin_write ON public.order_items FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY site_content_read ON public.site_content FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY site_content_admin_write ON public.site_content FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY contact_requests_insert ON public.contact_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY contact_requests_admin_read ON public.contact_requests FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));
CREATE POLICY contact_requests_admin_write ON public.contact_requests FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY exchange_rates_read ON public.exchange_rates FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY exchange_rates_admin_write ON public.exchange_rates FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY webhook_events_admin ON public.webhook_events FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.categories, public.products, public.site_content, public.exchange_rates
  TO anon, authenticated;
GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT SELECT ON public.profiles, public.orders, public.order_items, public.contact_requests,
  public.webhook_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.products, public.orders,
  public.order_items, public.site_content, public.contact_requests, public.exchange_rates,
  public.webhook_events TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT ALL ON public.profiles, public.categories, public.products, public.orders,
  public.order_items, public.site_content, public.contact_requests, public.exchange_rates,
  public.webhook_events TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products-images', 'products-images', true, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS storage_read_all ON storage.objects;
DROP POLICY IF EXISTS storage_write_admin ON storage.objects;
DROP POLICY IF EXISTS storage_update_admin ON storage.objects;
DROP POLICY IF EXISTS storage_delete_admin ON storage.objects;

CREATE POLICY storage_read_all ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products-images');
CREATE POLICY storage_write_admin ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products-images' AND (SELECT public.is_admin()));
CREATE POLICY storage_update_admin ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'products-images' AND (SELECT public.is_admin()));
CREATE POLICY storage_delete_admin ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products-images' AND (SELECT public.is_admin()));

COMMIT;
