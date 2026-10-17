/*
# Dhong Ghar — Upgrade: P&L, Payment Settings, Promo Codes, Analytics

## Summary
This migration adds cost tracking, mobile-payment verification fields, promo/coupon support, payment method settings, and a page-view analytics table to the existing Dhong Ghar schema.

## 1. Modified Tables

### products
- ADD `cost_price` numeric(10,2) DEFAULT 0 — the buying cost per unit, used for P&L / COGS calculations.

### orders
- ADD `sender_phone` text — customer's bKash/Nagad sender phone number.
- ADD `transaction_id` text — the TrxID the customer submits for mobile payment.
- ADD `promo_code` text — the promo/coupon code applied at checkout.
- ADD `discount_amount` numeric(10,2) DEFAULT 0 — the discount amount applied.

### settings
- ADD `bkash_number` text — bKash personal/merchant number shown at checkout.
- ADD `bkash_type` text DEFAULT 'personal' — 'personal' or 'merchant'.
- ADD `nagad_number` text — Nagad personal/merchant number.
- ADD `nagad_type` text DEFAULT 'personal'.
- ADD `payment_instructions` text — custom instructions shown for mobile payments.

## 2. New Tables

### promo_codes
- id (uuid, pk)
- code (text, unique) — the coupon string customers enter.
- discount_type (text) — 'percentage' or 'fixed'.
- discount_value numeric(10,2) — percentage (0-100) or fixed amount.
- min_order numeric(10,2) DEFAULT 0 — minimum subtotal for the code to apply.
- max_uses int — 0 means unlimited.
- uses_count int DEFAULT 0 — current usage count.
- is_active boolean DEFAULT true.
- expires_at timestamptz nullable.
- created_at timestamptz.

### page_views
- id (uuid, pk)
- product_id uuid nullable (fk products) — which product was viewed (null for non-product pages).
- page_path text — the route path viewed.
- visitor_id text — anonymous visitor identifier from localStorage.
- created_at timestamptz.

## 3. Security

- promo_codes: SELECT to anon (storefront needs to validate a code), INSERT/UPDATE/DELETE to authenticated only.
- page_views: INSERT to anon (storefront logs views), SELECT to authenticated (admin only). No update/delete needed.
- All existing policies remain unchanged.

## 4. Notes
1. All ALTER statements use DO $$ blocks with IF NOT EXISTS checks for idempotency.
2. No destructive operations — existing data is preserved.
3. The promo_codes table is intentionally readable by anon so the checkout can validate a code before applying it. However, only authenticated admins can create/edit codes.
*/

-- Add cost_price to products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add payment verification + promo fields to orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'sender_phone') THEN
    ALTER TABLE orders ADD COLUMN sender_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transaction_id') THEN
    ALTER TABLE orders ADD COLUMN transaction_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'promo_code') THEN
    ALTER TABLE orders ADD COLUMN promo_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add payment settings to settings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'bkash_number') THEN
    ALTER TABLE settings ADD COLUMN bkash_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'bkash_type') THEN
    ALTER TABLE settings ADD COLUMN bkash_type text NOT NULL DEFAULT 'personal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'nagad_number') THEN
    ALTER TABLE settings ADD COLUMN nagad_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'nagad_type') THEN
    ALTER TABLE settings ADD COLUMN nagad_type text NOT NULL DEFAULT 'personal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'payment_instructions') THEN
    ALTER TABLE settings ADD COLUMN payment_instructions text;
  END IF;
END $$;

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_uses int NOT NULL DEFAULT 0,
  uses_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_promo_codes" ON promo_codes;
CREATE POLICY "read_promo_codes" ON promo_codes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_promo_codes_ins" ON promo_codes;
CREATE POLICY "write_promo_codes_ins" ON promo_codes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "write_promo_codes_upd" ON promo_codes;
CREATE POLICY "write_promo_codes_upd" ON promo_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "write_promo_codes_del" ON promo_codes;
CREATE POLICY "write_promo_codes_del" ON promo_codes FOR DELETE TO authenticated USING (true);

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  page_path text NOT NULL,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_page_views" ON page_views;
CREATE POLICY "insert_page_views" ON page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "read_page_views" ON page_views;
CREATE POLICY "read_page_views" ON page_views FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "delete_page_views" ON page_views;
CREATE POLICY "delete_page_views" ON page_views FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_page_views_product ON page_views(product_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
