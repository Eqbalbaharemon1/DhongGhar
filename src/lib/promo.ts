import { supabase } from './supabase';
import type { PromoCode } from './types';

export type PromoResult = {
  valid: boolean;
  discount: number;
  code: string;
  error?: string;
  promo?: PromoCode;
};

export async function validatePromoCode(code: string, subtotal: number): Promise<PromoResult> {
  if (!code.trim()) return { valid: false, discount: 0, code: '', error: 'Enter a code' };

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, discount: 0, code, error: 'Invalid or expired code' };
  }

  const promo = data as PromoCode;

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, discount: 0, code, error: 'This code has expired' };
  }

  if (promo.max_uses > 0 && promo.uses_count >= promo.max_uses) {
    return { valid: false, discount: 0, code, error: 'This code has reached its usage limit' };
  }

  if (subtotal < promo.min_order) {
    return {
      valid: false,
      discount: 0,
      code,
      error: `Minimum order of ৳${promo.min_order} required`,
    };
  }

  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = (subtotal * promo.discount_value) / 100;
  } else {
    discount = Math.min(promo.discount_value, subtotal);
  }

  return { valid: true, discount: Math.round(discount * 100) / 100, code: promo.code, promo };
}

export async function incrementPromoUsage(code: string): Promise<void> {
  const { data } = await supabase
    .from('promo_codes')
    .select('uses_count')
    .eq('code', code)
    .maybeSingle();
  if (data) {
    await supabase
      .from('promo_codes')
      .update({ uses_count: (data.uses_count ?? 0) + 1 })
      .eq('code', code);
  }
}
