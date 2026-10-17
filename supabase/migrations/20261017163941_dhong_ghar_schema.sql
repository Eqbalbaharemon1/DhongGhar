/*
# Dhong Ghar — E-commerce Schema

A fashion brand storefront with admin panel.

## Single-tenant with admin auth

This app has a sign-in screen (admin only). Customer-facing browsing/ordering is anonymous.
- Admin: `authenticated` users who sign in. They manage all data.
- Public storefront: reads categories/products/banners/reviews and creates orders — runs as `anon`.

Strategy:
- Admin-managed tables (categories, products, product_images, banners, reviews, settings):
  SELECT open to anon+authenticated (storefront reads them).
  writes scoped to `authenticated` only (admin must be signed in).
- Orders + order_items: public can create (anon INSERT). SELECT open (order id acts as capability token for anon thank-you page). UPDATE/DELETE to authenticated (admin) only.
- Settings: single public row, anyone can read, only authenticated can update.

## Tables
1. categories — product categories (Saree, T-Shirt, Cosmetics, Accessories).
2. products — fashion items.
3. product_images — gallery images per product.
4. banners — home hero slider.
5. reviews — customer testimonials shown on home.
6. orders — customer orders.
7. order_items — line items.
8. settings — site settings (GTM, FB Pixel, GA, shipping costs, site name).
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_categories_ins" ON categories;
CREATE POLICY "write_categories_ins" ON categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_categories_upd" ON categories;
CREATE POLICY "write_categories_upd" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_categories_del" ON categories;
CREATE POLICY "write_categories_del" ON categories FOR DELETE TO authenticated USING (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(10,2),
  sku text,
  stock int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_products" ON products;
CREATE POLICY "read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_products_ins" ON products;
CREATE POLICY "write_products_ins" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_products_upd" ON products;
CREATE POLICY "write_products_upd" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_products_del" ON products;
CREATE POLICY "write_products_del" ON products FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(is_trending) WHERE is_trending = true;

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_product_images" ON product_images;
CREATE POLICY "read_product_images" ON product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_product_images_ins" ON product_images;
CREATE POLICY "write_product_images_ins" ON product_images FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_product_images_upd" ON product_images;
CREATE POLICY "write_product_images_upd" ON product_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_product_images_del" ON product_images;
CREATE POLICY "write_product_images_del" ON product_images FOR DELETE TO authenticated USING (true);

-- BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_banners" ON banners;
CREATE POLICY "read_banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_banners_ins" ON banners;
CREATE POLICY "write_banners_ins" ON banners FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_banners_upd" ON banners;
CREATE POLICY "write_banners_upd" ON banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_banners_del" ON banners;
CREATE POLICY "write_banners_del" ON banners FOR DELETE TO authenticated USING (true);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_reviews" ON reviews;
CREATE POLICY "read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_reviews_ins" ON reviews;
CREATE POLICY "write_reviews_ins" ON reviews FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_reviews_upd" ON reviews;
CREATE POLICY "write_reviews_upd" ON reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_reviews_del" ON reviews;
CREATE POLICY "write_reviews_del" ON reviews FOR DELETE TO authenticated USING (true);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  shipping_method text NOT NULL CHECK (shipping_method IN ('inside_dhaka','outside_dhaka')),
  payment_method text NOT NULL CHECK (payment_method IN ('cod','bkash','nagad')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_orders" ON orders;
CREATE POLICY "read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_orders" ON orders;
CREATE POLICY "insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_orders" ON orders;
CREATE POLICY "update_orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_orders" ON orders;
CREATE POLICY "delete_orders" ON orders FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant text,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_order_items" ON order_items;
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_order_items" ON order_items;
CREATE POLICY "update_order_items" ON order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_order_items" ON order_items;
CREATE POLICY "delete_order_items" ON order_items FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- SETTINGS (single row, id=1)
CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  gtm_container_id text,
  facebook_pixel_id text,
  google_analytics_id text,
  site_name text NOT NULL DEFAULT 'Dhong Ghar',
  default_shipping_inside numeric(10,2) NOT NULL DEFAULT 60,
  default_shipping_outside numeric(10,2) NOT NULL DEFAULT 120,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_settings" ON settings;
CREATE POLICY "read_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_settings_ins" ON settings;
CREATE POLICY "write_settings_ins" ON settings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_settings_upd" ON settings;
CREATE POLICY "write_settings_upd" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO settings (id, site_name) VALUES (1, 'Dhong Ghar')
  ON CONFLICT (id) DO NOTHING;
