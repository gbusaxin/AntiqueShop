-- init.sql — схема магазина VintagEmpire.
-- Безопасно запускать повторно на рабочей базе: таблицы и данные (товары, заказы, профили,
-- заявки) НЕ удаляются. Скрипт только создаёт недостающее, добавляет новые колонки и
-- заново выставляет функции, триггеры, политики RLS и права доступа.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Роли customer/admin соответствуют проверкам в приложении.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ru TEXT NOT NULL CHECK (length(btrim(name_ru)) > 0),
  name_en TEXT NOT NULL CHECK (length(btrim(name_en)) > 0),
  name_de TEXT,
  description_ru TEXT,
  description_en TEXT,
  description_de TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- price_override сохранён для работающего механизма расчёта региональных цен.
-- images — JSON-массив URL; из Supabase JS он возвращается как string[].
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE CHECK (sku ~ '^[0-9]{7}$'),
  name_ru TEXT NOT NULL CHECK (length(btrim(name_ru)) > 0),
  name_en TEXT,
  name_de TEXT,
  description_ru TEXT NOT NULL CHECK (length(btrim(description_ru)) > 0),
  description_en TEXT,
  description_de TEXT,
  price_eur NUMERIC(10,2) NOT NULL CHECK (price_eur > 0),
  price_override JSONB,
  price_override_amount NUMERIC(10,2) CHECK (price_override_amount IS NULL OR price_override_amount > 0),
  price_override_currency TEXT,
  material TEXT NOT NULL CHECK (length(btrim(material)) > 0),
  size TEXT NOT NULL CHECK (length(btrim(size)) > 0),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  country_of_origin TEXT,
  year_circa TEXT,
  provenance_ru TEXT,
  provenance_en TEXT,
  provenance_de TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array'),
  is_available BOOLEAN NOT NULL DEFAULT true,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL UNIQUE CHECK (page_key IN ('about', 'contacts', 'legal_offer', 'legal_privacy')),
  title_ru TEXT,
  title_en TEXT,
  title_de TEXT,
  content_ru TEXT,
  content_en TEXT,
  content_de TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) <= 160 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ru TEXT NOT NULL DEFAULT '' CHECK (length(title_ru) <= 300),
  title_en TEXT NOT NULL DEFAULT '' CHECK (length(title_en) <= 300),
  title_de TEXT NOT NULL DEFAULT '' CHECK (length(title_de) <= 300),
  excerpt_ru TEXT NOT NULL DEFAULT '' CHECK (length(excerpt_ru) <= 1000),
  excerpt_en TEXT NOT NULL DEFAULT '' CHECK (length(excerpt_en) <= 1000),
  excerpt_de TEXT NOT NULL DEFAULT '' CHECK (length(excerpt_de) <= 1000),
  content_ru TEXT NOT NULL DEFAULT '' CHECK (length(content_ru) <= 50000),
  content_en TEXT NOT NULL DEFAULT '' CHECK (length(content_en) <= 50000),
  content_de TEXT NOT NULL DEFAULT '' CHECK (length(content_de) <= 50000),
  tags TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20 AND array_position(tags, NULL) IS NULL),
  images JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 10),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT is_published OR (published_at IS NOT NULL AND (
    (length(btrim(title_ru)) > 0 AND length(btrim(content_ru)) > 0) OR
    (length(btrim(title_en)) > 0 AND length(btrim(content_en)) > 0) OR
    (length(btrim(title_de)) > 0 AND length(btrim(content_de)) > 0)
  )))
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published_at DESC, id) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING gin(tags);

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

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CONSTRAINT orders_status_check
    CHECK (status IN ('new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
  region TEXT NOT NULL,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'yookassa', 'cloudpayments')),
  payment_session_id TEXT,
  payment_intent_id TEXT,
  currency TEXT NOT NULL,
  total_eur NUMERIC(10,2) NOT NULL CHECK (total_eur >= 0),
  total_local NUMERIC(10,2),
  exchange_rate NUMERIC(10,6),
  shipping_address JSONB,
  shipping_method TEXT,
  shipping_cost_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  email TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Для уже существующей базы: колонки, которых не было в первой версии схемы.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS locale TEXT;

-- The "condition" attribute was removed from the shop (2026-11-22)
ALTER TABLE public.products DROP COLUMN IF EXISTS condition;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot JSONB,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_eur NUMERIC(10,2) NOT NULL CHECK (price_eur > 0)
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы для каталога, фильтров, заказов и очистки webhook_events.
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_session ON public.orders(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at DESC);

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, 'customer', NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_views(product_slug TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.products SET views_count = views_count + 1
  WHERE slug = product_slug AND is_available = true;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_views(TEXT) FROM PUBLIC;
-- Счётчик просмотров вызывается только сервером (с лимитом по IP), не напрямую через API.
REVOKE ALL ON FUNCTION public.increment_views(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(TEXT) TO service_role;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER profiles_update_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER categories_update_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER products_update_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER site_content_update_updated_at BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER orders_update_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER blog_posts_update_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blog_posts_read ON public.blog_posts;
CREATE POLICY blog_posts_read ON public.blog_posts FOR SELECT TO anon, authenticated
  USING ((is_published AND published_at <= now()) OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS blog_posts_admin_insert ON public.blog_posts;
CREATE POLICY blog_posts_admin_insert ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS blog_posts_admin_update ON public.blog_posts;
CREATE POLICY blog_posts_admin_update ON public.blog_posts FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS blog_posts_admin_delete ON public.blog_posts;
CREATE POLICY blog_posts_admin_delete ON public.blog_posts FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));
REVOKE ALL ON public.blog_posts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 10485760, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS blog_storage_read ON storage.objects;
CREATE POLICY blog_storage_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');
DROP POLICY IF EXISTS blog_storage_insert ON storage.objects;
CREATE POLICY blog_storage_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS blog_storage_update ON storage.objects;
CREATE POLICY blog_storage_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'blog-images' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS blog_storage_delete ON storage.objects;
CREATE POLICY blog_storage_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND (SELECT public.is_admin()));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Профиль создаётся только через Auth-триггер. Из клиента разрешены только безопасные поля.
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS categories_read ON public.categories;
CREATE POLICY categories_read ON public.categories FOR SELECT TO anon, authenticated
  USING (is_active OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS categories_admin_insert ON public.categories;
CREATE POLICY categories_admin_insert ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS categories_admin_update ON public.categories;
CREATE POLICY categories_admin_update ON public.categories FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
CREATE POLICY categories_admin_delete ON public.categories FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS products_read ON public.products;
CREATE POLICY products_read ON public.products FOR SELECT TO anon, authenticated
  USING (is_available OR (SELECT public.is_admin()));
DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update ON public.products FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete ON public.products FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS site_content_read ON public.site_content;
CREATE POLICY site_content_read ON public.site_content FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS site_content_admin_insert ON public.site_content;
CREATE POLICY site_content_admin_insert ON public.site_content FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS site_content_admin_update ON public.site_content;
CREATE POLICY site_content_admin_update ON public.site_content FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS site_content_admin_delete ON public.site_content;
CREATE POLICY site_content_admin_delete ON public.site_content FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS contact_requests_insert ON public.contact_requests;
CREATE POLICY contact_requests_insert ON public.contact_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS contact_requests_admin_read ON public.contact_requests;
CREATE POLICY contact_requests_admin_read ON public.contact_requests FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));
DROP POLICY IF EXISTS contact_requests_admin_update ON public.contact_requests;
CREATE POLICY contact_requests_admin_update ON public.contact_requests FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS contact_requests_admin_delete ON public.contact_requests;
CREATE POLICY contact_requests_admin_delete ON public.contact_requests FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS exchange_rates_read ON public.exchange_rates;
CREATE POLICY exchange_rates_read ON public.exchange_rates FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS exchange_rates_admin_insert ON public.exchange_rates;
CREATE POLICY exchange_rates_admin_insert ON public.exchange_rates FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS exchange_rates_admin_update ON public.exchange_rates;
CREATE POLICY exchange_rates_admin_update ON public.exchange_rates FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS exchange_rates_admin_delete ON public.exchange_rates;
CREATE POLICY exchange_rates_admin_delete ON public.exchange_rates FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS orders_read ON public.orders;
CREATE POLICY orders_read ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
-- Заказы создаёт только сервер (service_role): клиент не может подделать сумму.
DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS orders_admin_update ON public.orders;
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS orders_admin_delete ON public.orders;
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS order_items_read ON public.order_items;
CREATE POLICY order_items_read ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id
    AND (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))));
-- Заказы создаёт только сервер (service_role): клиент не может подделать сумму.
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_admin_update ON public.order_items;
CREATE POLICY order_items_admin_update ON public.order_items FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS order_items_admin_delete ON public.order_items;
CREATE POLICY order_items_admin_delete ON public.order_items FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS webhook_events_admin ON public.webhook_events;
CREATE POLICY webhook_events_admin ON public.webhook_events FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

REVOKE ALL ON public.profiles, public.categories, public.products, public.site_content,
  public.contact_requests, public.exchange_rates, public.orders, public.order_items,
  public.webhook_events FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.categories, public.products, public.site_content, public.exchange_rates TO anon, authenticated;
GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT SELECT ON public.profiles, public.orders, public.order_items, public.contact_requests, public.webhook_events TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.products, public.site_content,
  public.contact_requests, public.exchange_rates, public.webhook_events TO authenticated;
GRANT UPDATE, DELETE ON public.orders, public.order_items TO authenticated;
GRANT ALL ON public.profiles, public.categories, public.products, public.site_content,
  public.contact_requests, public.exchange_rates, public.orders, public.order_items,
  public.webhook_events TO service_role;

-- Сохраняем существующий bucket; файлы внутри него не удаляем.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products-images', 'products-images', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS storage_read_all ON storage.objects;
CREATE POLICY storage_read_all ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products-images');
DROP POLICY IF EXISTS storage_write_admin ON storage.objects;
CREATE POLICY storage_write_admin ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products-images' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS storage_update_admin ON storage.objects;
CREATE POLICY storage_update_admin ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'products-images' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS storage_delete_admin ON storage.objects;
CREATE POLICY storage_delete_admin ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products-images' AND (SELECT public.is_admin()));

-- Seed: добавляет только отсутствующие категории и страницы, существующие не трогает.
INSERT INTO public.categories (name_ru, name_en, name_de, slug, sort_order) VALUES
  ('Фарфор', 'Porcelain', 'Porzellan', 'porcelain', 1),
  ('Хрусталь', 'Crystal', 'Kristall', 'crystal', 2),
  ('Серебро', 'Silver', 'Silber', 'silver', 3),
  ('Бронза', 'Bronze', 'Bronze', 'bronze', 4),
  ('Картины', 'Paintings', 'Gemälde', 'paintings', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_content
  (page_key, title_ru, title_en, title_de, content_ru, content_en, content_de, metadata) VALUES
  ('about', 'О нас', 'About Us', 'Über uns',
   'Редактируется в /admin/content', 'Edit in /admin/content', 'Bearbeiten in /admin/content', '{}'::jsonb),
  ('contacts', 'Контакты', 'Contacts', 'Kontakt',
   'Редактируется в /admin/content', 'Edit in /admin/content', 'Bearbeiten in /admin/content',
   '{"address":"","phone":"","email":"","working_hours":"","map_coordinates":""}'::jsonb),
  ('legal_offer', 'Публичная оферта', 'Public Offer', 'Öffentliches Angebot',
   'Редактируется в /admin/content', 'Edit in /admin/content', 'Bearbeiten in /admin/content', '{}'::jsonb),
  ('legal_privacy', 'Политика конфиденциальности', 'Privacy Policy', 'Datenschutz',
   'Редактируется в /admin/content', 'Edit in /admin/content', 'Bearbeiten in /admin/content', '{}'::jsonb)
ON CONFLICT (page_key) DO NOTHING;

-- Создаёт профиль только тем пользователям, у кого его ещё нет (роли не сбрасываются).
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'customer', raw_user_meta_data ->> 'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Первый запуск на пустой базе: назначьте себе admin вручную в SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT COUNT(*) FROM public.categories;
-- SELECT page_key FROM public.site_content;
-- SELECT COUNT(*) FROM public.profiles;
COMMIT;
