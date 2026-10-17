import { useEffect, useState } from 'react';
import { Search, Loader2, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/types';

type Customer = {
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
};

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('orders')
      .select('customer_name, phone, address, total, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const orders = (data as Order[]) ?? [];
        const map = new Map<string, Customer>();
        for (const o of orders) {
          const key = o.phone;
          const existing = map.get(key);
          if (existing) {
            existing.orderCount += 1;
            if (o.status !== 'cancelled') existing.totalSpent += Number(o.total);
            existing.lastOrder = o.created_at;
          } else {
            map.set(key, {
              name: o.customer_name,
              phone: o.phone,
              address: o.address,
              orderCount: 1,
              totalSpent: o.status !== 'cancelled' ? Number(o.total) : 0,
              lastOrder: o.created_at,
            });
          }
        }
        setCustomers(Array.from(map.values()));
        setLoading(false);
      });
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Customers</h1>
        <p className="text-sm text-[#1A1A1A]/50 mt-1">{customers.length} customers</p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full sm:max-w-sm pl-10 pr-4 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-10 text-center text-[#1A1A1A]/40">
          <Loader2 size={20} className="inline animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-10 text-center text-sm text-[#1A1A1A]/40">
          No customers found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.phone}
              className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#1A1A1A]">{c.name}</h3>
                  <p className="text-xs text-[#1A1A1A]/50 mt-1 flex items-center gap-1.5">
                    <Phone size={11} /> {c.phone}
                  </p>
                  <p className="text-xs text-[#1A1A1A]/50 mt-1 flex items-start gap-1.5">
                    <MapPin size={11} className="mt-0.5 flex-shrink-0" /> {c.address}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1A1A1A]/8 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#1A1A1A]/60">
                  <ShoppingBag size={12} /> {c.orderCount} order{c.orderCount > 1 ? 's' : ''}
                </span>
                <span className="font-medium text-[#1A1A1A]">{formatPrice(c.totalSpent)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
