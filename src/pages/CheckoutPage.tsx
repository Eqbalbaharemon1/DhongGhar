import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Tag, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { formatPrice, generateOrderNumber } from '@/lib/utils';
import { trackInitiateCheckout } from '@/lib/tracking';
import { validatePromoCode, incrementPromoUsage } from '@/lib/promo';
import type { ShippingMethod, PaymentMethod } from '@/lib/types';

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { navigate } = useRouter();
  const { settings } = useSettings();
  const [shipping, setShipping] = useState<ShippingMethod>('inside_dhaka');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    senderPhone: '',
    transactionId: '',
  });
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    discount: number;
    code: string;
    error?: string;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const shippingCost =
    shipping === 'inside_dhaka'
      ? Number(settings.default_shipping_inside)
      : Number(settings.default_shipping_outside);
  const discount = promoResult?.valid ? promoResult.discount : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout(
        items.map((i) => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
        total,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    const result = await validatePromoCode(promoInput, subtotal);
    setPromoResult(result);
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoInput('');
    setPromoResult(null);
  };

  if (items.length === 0 && !submitting) {
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-7xl px-4">
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Your cart is empty</h1>
        <button
          onClick={() => navigate('/shop')}
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:gap-3 transition-all"
        >
          <ArrowLeft size={14} /> Browse products
        </button>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, '')))
      e.phone = 'Enter a valid Bangladeshi phone number';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    if (payment === 'bkash' || payment === 'nagad') {
      if (!form.senderPhone.trim()) e.senderPhone = 'Sender phone is required for mobile payment';
      if (!form.transactionId.trim()) e.transactionId = 'Transaction ID is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const orderNumber = await generateOrderNumber();
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        shipping_method: shipping,
        payment_method: payment,
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discount,
        total,
        status: 'pending',
        notes: form.notes || null,
        sender_phone: (payment === 'bkash' || payment === 'nagad') ? form.senderPhone : null,
        transaction_id: (payment === 'bkash' || payment === 'nagad') ? form.transactionId : null,
        promo_code: promoResult?.valid ? promoResult.code : null,
      })
      .select()
      .single();

    if (error || !order) {
      setSubmitting(false);
      setErrors({ submit: 'Could not place order. Please try again.' });
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      variant: i.variant,
      quantity: i.quantity,
      unit_price: i.price,
      line_total: i.price * i.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);

    if (promoResult?.valid) {
      await incrementPromoUsage(promoResult.code);
    }

    clear();
    navigate(`/thank-you/${order.id}`);
  };

  const paymentNumber =
    payment === 'bkash' ? settings.bkash_number : payment === 'nagad' ? settings.nagad_number : null;
  const paymentType =
    payment === 'bkash' ? settings.bkash_type : payment === 'nagad' ? settings.nagad_type : '';

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-6">
          <button
            onClick={() => navigate('/cart')}
            className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={12} /> Back to cart
          </button>
          <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A]">Checkout</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Customer */}
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Customer Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} />
                <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} placeholder="01XXXXXXXXX" />
              </div>
              <div className="mt-4">
                <Field label="Delivery Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} error={errors.address} textarea />
              </div>
              <div className="mt-4">
                <Field label="Order Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />
              </div>
            </section>

            {/* Shipping */}
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Shipping Method
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <OptionCard selected={shipping === 'inside_dhaka'} onClick={() => setShipping('inside_dhaka')} title="Inside Dhaka" desc="Delivery within 1-2 days" price={formatPrice(Number(settings.default_shipping_inside))} />
                <OptionCard selected={shipping === 'outside_dhaka'} onClick={() => setShipping('outside_dhaka')} title="Outside Dhaka" desc="Delivery within 3-5 days" price={formatPrice(Number(settings.default_shipping_outside))} />
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Payment Method
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <OptionCard selected={payment === 'cod'} onClick={() => setPayment('cod')} title="Cash on Delivery" desc="Pay when you receive" />
                <OptionCard selected={payment === 'bkash'} onClick={() => setPayment('bkash')} title="bKash" desc="Mobile payment" />
                <OptionCard selected={payment === 'nagad'} onClick={() => setPayment('nagad')} title="Nagad" desc="Mobile payment" />
              </div>

              {/* Dynamic payment instructions */}
              {(payment === 'bkash' || payment === 'nagad') && paymentNumber && (
                <div className="mt-4 p-4 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 rounded-sm">
                  <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">
                    {payment === 'bkash' ? 'bKash' : 'Nagad'} Payment Instructions
                  </h3>
                  <div className="space-y-1.5 text-sm text-[#1A1A1A]/70">
                    <p>
                      Send <span className="font-semibold text-[#1A1A1A]">{formatPrice(total)}</span> to:
                    </p>
                    <p className="text-lg font-semibold tracking-wide text-[#1A1A1A]">
                      {paymentNumber}
                    </p>
                    <p className="text-xs capitalize">Type: {paymentType || 'Personal'}</p>
                    {settings.payment_instructions && (
                      <p className="text-xs text-[#1A1A1A]/60 mt-2 leading-relaxed">
                        {settings.payment_instructions}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <Field
                      label="Your Sender Phone Number"
                      value={form.senderPhone}
                      onChange={(v) => setForm({ ...form, senderPhone: v })}
                      error={errors.senderPhone}
                      placeholder="01XXXXXXXXX"
                    />
                    <Field
                      label="Transaction ID (TrxID)"
                      value={form.transactionId}
                      onChange={(v) => setForm({ ...form, transactionId: v })}
                      error={errors.transactionId}
                      placeholder="e.g. 8N7K2M3L4X"
                    />
                  </div>
                </div>
              )}

              {(payment === 'bkash' || payment === 'nagad') && !paymentNumber && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                  <p className="text-sm text-amber-800">
                    {payment === 'bkash' ? 'bKash' : 'Nagad'} number is not configured yet. Please
                    choose Cash on Delivery or contact us.
                  </p>
                </div>
              )}
            </section>

            {/* Promo Code */}
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Promo Code
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-[#FAF9F6] border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#1A1A1A] uppercase"
                    disabled={promoResult?.valid}
                  />
                </div>
                {promoResult?.valid ? (
                  <button
                    onClick={removePromo}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm border border-[#1A1A1A]/20 text-[#1A1A1A] rounded-sm hover:bg-[#1A1A1A]/5"
                  >
                    <X size={14} /> Remove
                  </button>
                ) : (
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm bg-[#1A1A1A] text-[#FAF9F6] rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50"
                  >
                    {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                )}
              </div>
              {promoResult?.valid && (
                <p className="mt-2 text-sm text-emerald-700 flex items-center gap-1.5">
                  <Check size={14} /> Code "{promoResult.code}" applied — you saved {formatPrice(promoResult.discount)}
                </p>
              )}
              {promoResult && !promoResult.valid && (
                <p className="mt-2 text-sm text-red-600">{promoResult.error}</p>
              )}
            </section>

            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
          </div>

          {/* Summary */}
          <div className="md:col-span-1">
            <div className="sticky top-28 p-6 border border-[#1A1A1A]/10 rounded-sm bg-[#FAF9F6]">
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Your Order
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((i) => (
                  <div key={`${i.productId}-${i.variant}`} className="flex gap-3">
                    <div className="relative w-14 h-16 flex-shrink-0 overflow-hidden rounded-sm bg-[#1A1A1A]/5">
                      <img src={i.image} alt="" className="h-full w-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-[#FAF9F6] text-[0.6rem] rounded-full w-4 h-4 flex items-center justify-center">
                        {i.quantity}
                      </span>
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-[#1A1A1A] leading-tight">{i.name}</p>
                      <p className="text-[#1A1A1A]/50 mt-0.5">{i.variant}</p>
                      <p className="text-[#1A1A1A]/70 mt-1">{formatPrice(i.price * i.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#1A1A1A]/10 space-y-2 text-sm">
                <div className="flex justify-between text-[#1A1A1A]/70">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#1A1A1A]/70">
                  <span>Shipping</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="pt-2 border-t border-[#1A1A1A]/10 flex justify-between text-base font-medium text-[#1A1A1A]">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] py-3.5 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Placing Order...</>
                ) : (
                  <><Check size={16} /> Place Order</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, error, placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; textarea?: boolean;
}) {
  const baseClass = `w-full px-4 py-3 text-sm bg-[#FAF9F6] border rounded-sm focus:outline-none transition-colors ${
    error ? 'border-red-400 focus:border-red-500' : 'border-[#1A1A1A]/20 focus:border-[#1A1A1A]'
  }`;
  return (
    <div>
      <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={baseClass} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={baseClass} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function OptionCard({
  selected, onClick, title, desc, price,
}: {
  selected: boolean; onClick: () => void; title: string; desc: string; price?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 border rounded-sm transition-colors ${
        selected ? 'border-[#1A1A1A] bg-[#1A1A1A]/5' : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1A1A1A]">{title}</span>
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected ? 'border-[#1A1A1A] bg-[#1A1A1A]' : 'border-[#1A1A1A]/30'}`} />
      </div>
      <p className="mt-1 text-xs text-[#1A1A1A]/50">{desc}</p>
      {price && <p className="mt-2 text-xs font-medium text-[#1A1A1A]">{price}</p>}
    </button>
  );
}
