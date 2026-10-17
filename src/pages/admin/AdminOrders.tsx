import { useEffect, useState } from 'react';
import { X, Search, Loader2, Phone, MapPin, Download, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

function exportOrdersCSV(orders: Order[]) {
  const headers = ['Order #', 'Customer', 'Phone', 'Address', 'Shipping', 'Payment', 'Sender Phone', 'TrxID', 'Promo Code', 'Subtotal', 'Discount', 'Shipping Cost', 'Total', 'Status', 'Date'];
  const rows = orders.map((o) => [
    o.order_number,
    o.customer_name,
    o.phone,
    o.address.replace(/,/g, ';'),
    o.shipping_method,
    o.payment_method,
    o.sender_phone ?? '',
    o.transaction_id ?? '',
    o.promo_code ?? '',
    o.subtotal,
    o.discount_amount,
    o.shipping_cost,
    o.total,
    o.status,
    new Date(o.created_at).toISOString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dhong_ghar_orders_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Orders</h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-1">{orders.length} total orders</p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={() => exportOrdersCSV(filtered)}
            className="inline-flex items-center gap-2 border border-[#1A1A1A]/20 text-[#1A1A1A] px-4 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/5 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, or phone..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
          className="px-4 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-sm border border-[#1A1A1A]/8 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#1A1A1A]/40">
            <Loader2 size={20} className="inline animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#1A1A1A]/40">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#1A1A1A]/50 border-b border-[#1A1A1A]/8">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/5">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="hover:bg-[#FAF9F6]/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#1A1A1A]">{o.customer_name}</p>
                      <p className="text-xs text-[#1A1A1A]/40">{o.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{formatPrice(Number(o.total))}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]/60 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[0.65rem] px-2 py-0.5 rounded-full capitalize ${statusColors[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => updateStatus(selected.id, s)}
        />
      )}
    </div>
  );
}

function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (s: OrderStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end">
      <div className="bg-[#FAF9F6] w-full max-w-md h-full overflow-y-auto">
        <div className="sticky top-0 bg-[#FAF9F6] border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-[#1A1A1A] font-semibold">
              {order.order_number}
            </h2>
            <p className="text-xs text-[#1A1A1A]/50">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-2">Order Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`text-xs px-3 py-1.5 rounded-sm capitalize transition-colors ${
                    order.status === s
                      ? statusColors[s] + ' ring-1 ring-current'
                      : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]/60 hover:border-[#1A1A1A]/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white border border-[#1A1A1A]/8 rounded-sm p-4">
            <h3 className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 mb-3">Customer</h3>
            <p className="text-sm font-medium text-[#1A1A1A]">{order.customer_name}</p>
            <p className="mt-1 text-xs text-[#1A1A1A]/60 flex items-center gap-1.5">
              <Phone size={12} /> {order.phone}
            </p>
            <p className="mt-1 text-xs text-[#1A1A1A]/60 flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" /> {order.address}
            </p>
          </div>

          {/* Shipping & Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-[#1A1A1A]/8 rounded-sm p-4">
              <h3 className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 mb-2">Shipping</h3>
              <p className="text-sm text-[#1A1A1A] capitalize">
                {order.shipping_method.replace('_', ' ')}
              </p>
              <p className="text-xs text-[#1A1A1A]/50 mt-1">{formatPrice(Number(order.shipping_cost))}</p>
            </div>
            <div className="bg-white border border-[#1A1A1A]/8 rounded-sm p-4">
              <h3 className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 mb-2">Payment</h3>
              <p className="text-sm text-[#1A1A1A] uppercase">{order.payment_method}</p>
              {order.sender_phone && (
                <p className="text-xs text-[#1A1A1A]/60 mt-1.5">Sender: {order.sender_phone}</p>
              )}
              {order.transaction_id && (
                <p className="text-xs text-[#1A1A1A]/60 mt-0.5 flex items-center gap-1">
                  <Receipt size={11} /> TrxID: {order.transaction_id}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-[#1A1A1A]/8 rounded-sm p-4">
            <h3 className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 mb-3">Items</h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="text-[#1A1A1A]">{item.product_name}</p>
                    <p className="text-xs text-[#1A1A1A]/40">
                      {item.variant} · Qty {item.quantity} · {formatPrice(Number(item.unit_price))}
                    </p>
                  </div>
                  <span className="text-[#1A1A1A] font-medium">
                    {formatPrice(Number(item.line_total))}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 space-y-1.5 text-sm">
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount {order.promo_code ? `(${order.promo_code})` : ''}</span>
                  <span>-{formatPrice(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between text-[#1A1A1A]/60">
                <span>Shipping</span>
                <span>{formatPrice(Number(order.shipping_cost))}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#1A1A1A] pt-1">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white border border-[#1A1A1A]/8 rounded-sm p-4">
              <h3 className="text-xs tracking-wide uppercase text-[#1A1A1A]/50 mb-2">Notes</h3>
              <p className="text-sm text-[#1A1A1A]/70">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
