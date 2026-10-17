import { useEffect, useRef, useState } from 'react';
import { Check, Printer, ArrowRight, ShoppingBag, Phone, MapPin, Truck, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { useRouter } from '@/lib/router';
import { formatPrice } from '@/lib/utils';
import { trackPurchase } from '@/lib/tracking';

export function ThankYouPage({ orderId }: { orderId: string }) {
  const { navigate } = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        const o = data as Order | null;
        setOrder(o);
        setLoading(false);
        if (o && o.order_items) {
          trackPurchase(
            o.order_number,
            o.order_items.map((i) => ({
              id: i.product_id ?? i.product_name,
              name: i.product_name,
              price: Number(i.unit_price),
              quantity: i.quantity,
              variant: i.variant ?? undefined,
            })),
            Number(o.total),
          );
        }
      });
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-7xl px-4">
        <div className="animate-pulse text-sm text-[#1A1A1A]/50">Loading your order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-7xl px-4">
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Order not found</h1>
        <button
          onClick={() => navigate('/shop')}
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:gap-3 transition-all"
        >
          <ArrowRight size={14} /> Continue shopping
        </button>
      </div>
    );
  }

  const shippingLabel =
    order.shipping_method === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka';
  const paymentLabel =
    order.payment_method === 'cod'
      ? 'Cash on Delivery'
      : order.payment_method === 'bkash'
      ? 'bKash'
      : 'Nagad';

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#FAF9F6]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Confirmation banner */}
        <div className="pt-8 text-center print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h1 className="mt-6 font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
            Thank you for your order!
          </h1>
          <p className="mt-3 text-sm text-[#1A1A1A]/60 max-w-md mx-auto">
            Your order has been placed successfully. We'll contact you on{' '}
            <span className="text-[#1A1A1A]">{order.phone}</span> to confirm delivery.
          </p>
          <p className="mt-2 text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/40">
            Order #{order.order_number}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 border border-[#1A1A1A] text-[#1A1A1A] px-5 py-3 text-sm tracking-wide hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors rounded-sm"
            >
              <Printer size={16} /> Print / Save Invoice
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-5 py-3 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm"
            >
              <ShoppingBag size={16} /> Continue Shopping
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div
          ref={invoiceRef}
          className="mt-10 bg-white border border-[#1A1A1A]/10 rounded-sm p-6 md:p-10 print:border-0 print:shadow-none"
        >
          {/* Invoice header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-8 border-b border-[#1A1A1A]/10">
            <div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-2xl tracking-[0.18em] font-semibold text-[#1A1A1A]">
                  DHONG GHAR
                </span>
                <span className="text-[0.55rem] tracking-[0.3em] text-[#1A1A1A]/50 mt-1">
                  ঢং ঘর · FASHION
                </span>
              </div>
              <p className="mt-4 text-xs text-[#1A1A1A]/60 max-w-xs leading-relaxed">
                Dhaka, Bangladesh<br />
                hello@dhongghar.com · +880 1700 000000
              </p>
            </div>
            <div className="md:text-right">
              <h2 className="font-serif text-xl text-[#1A1A1A]">Invoice</h2>
              <p className="mt-2 text-xs text-[#1A1A1A]/60">
                Order #: <span className="text-[#1A1A1A] font-medium">{order.order_number}</span>
              </p>
              <p className="mt-1 text-xs text-[#1A1A1A]/60">
                Date:{' '}
                <span className="text-[#1A1A1A]">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <span className="mt-3 inline-block text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 capitalize">
                {order.status}
              </span>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid sm:grid-cols-2 gap-6 py-8 border-b border-[#1A1A1A]/10">
            <div>
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A]/50 mb-3">
                Bill To
              </h3>
              <p className="text-sm font-medium text-[#1A1A1A]">{order.customer_name}</p>
              <p className="mt-1 text-xs text-[#1A1A1A]/60 flex items-center gap-1.5">
                <Phone size={12} /> {order.phone}
              </p>
              <p className="mt-1 text-xs text-[#1A1A1A]/60 flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" /> {order.address}
              </p>
            </div>
            <div>
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A]/50 mb-3">
                Shipping & Payment
              </h3>
              <p className="text-xs text-[#1A1A1A]/70 flex items-center gap-1.5">
                <Truck size={12} /> {shippingLabel}
              </p>
              <p className="mt-1 text-xs text-[#1A1A1A]/70 flex items-center gap-1.5">
                <CreditCard size={12} /> {paymentLabel}
              </p>
              {order.notes && (
                <p className="mt-3 text-xs text-[#1A1A1A]/50">
                  <span className="text-[#1A1A1A]/70">Notes:</span> {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 text-left border-b border-[#1A1A1A]/10">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium text-center">Qty</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item) => (
                  <tr key={item.id} className="border-b border-[#1A1A1A]/5">
                    <td className="py-3">
                      <p className="text-[#1A1A1A]">{item.product_name}</p>
                      {item.variant && (
                        <p className="text-xs text-[#1A1A1A]/50 mt-0.5">{item.variant}</p>
                      )}
                    </td>
                    <td className="py-3 text-center text-[#1A1A1A]/70">{item.quantity}</td>
                    <td className="py-3 text-right text-[#1A1A1A]/70">
                      {formatPrice(Number(item.unit_price))}
                    </td>
                    <td className="py-3 text-right text-[#1A1A1A] font-medium">
                      {formatPrice(Number(item.line_total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-[#1A1A1A]/70">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-[#1A1A1A]/70">
                <span>Shipping ({shippingLabel})</span>
                <span>{formatPrice(Number(order.shipping_cost))}</span>
              </div>
              <div className="pt-2 border-t border-[#1A1A1A]/10 flex justify-between text-base font-semibold text-[#1A1A1A]">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <p className="mt-8 pt-6 border-t border-[#1A1A1A]/10 text-center text-xs text-[#1A1A1A]/40">
            Thank you for shopping with Dhong Ghar. This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
