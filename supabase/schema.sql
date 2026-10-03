CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
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

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_ru TEXT,
  name_en TEXT,
  name_de TEXT,
  description_ru TEXT,
  description_en TEXT,
  description_de TEXT,
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

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
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

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_snapshot JSONB,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_eur DECIMAL(10,2) NOT NULL
);

CREATE TABLE site_content (
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

CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  locale TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  rates JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_update_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_update_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_update_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_is_available_idx ON products(is_available);
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_status_idx ON orders(status);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (is_admin());

CREATE POLICY "Anyone can read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can read available products"
ON products FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can read their own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can read and update all orders"
ON orders FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can read their own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage order items"
ON order_items FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can read site content"
ON site_content FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site content"
ON site_content FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can create contact requests"
ON contact_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can read and update contact requests"
ON contact_requests FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update contact requests"
ON contact_requests FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can read exchange rates"
ON exchange_rates FOR SELECT
USING (true);

CREATE POLICY "Service role can write exchange rates"
ON exchange_rates FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION increment_views(product_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET views_count = views_count + 1
  WHERE slug = product_slug AND is_available = true;
END;
$$;
