export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number;
  sku: string | null;
  stock: number;
  is_featured: boolean;
  is_trending: boolean;
  is_active: boolean;
  created_at: string;
  category?: Category | null;
  product_images?: ProductImage[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_active: boolean;
  created_at: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingMethod = 'inside_dhaka' | 'outside_dhaka';
export type PaymentMethod = 'cod' | 'bkash' | 'nagad';

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  shipping_method: ShippingMethod;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  sender_phone: string | null;
  transaction_id: string | null;
  promo_code: string | null;
  discount_amount: number;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type PromoCode = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type PageView = {
  id: string;
  product_id: string | null;
  page_path: string;
  visitor_id: string | null;
  created_at: string;
};

export type Settings = {
  id: number;
  gtm_container_id: string | null;
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
  site_name: string;
  default_shipping_inside: number;
  default_shipping_outside: number;
  bkash_number: string | null;
  bkash_type: string;
  nagad_number: string | null;
  nagad_type: string;
  payment_instructions: string | null;
  updated_at: string;
};
