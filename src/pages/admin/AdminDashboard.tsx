import { useEffect, useState } from 'react';
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock,
  Eye, Percent, BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useRouter } from '@/lib/router';
import type { Order, Product, PageView } from '@/lib/types';

type OrderWithItems = Order & {
  order_items?: {
    product_id: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

export function AdminDashboard() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    customers: 0,
    pending: 0,
    pageViews: 0,
    activeVisitors: 0,
    aov: 0,
    conversionRate: 0,
    margin: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; views: number }[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; revenue: number; profit: number }[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ method: string; count: number; amount: number }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, cost_price, price', { count: 'exact' }),
      supabase.from('orders').select('*, order_items(*)'),
      supabase.from('page_views').select('id, product_id, page_path, visitor_id, created_at'),
    ]).then(([pRes, oRes, vRes]) => {
      const products = (pRes.data as Product[]) ?? [];
      const orders = (oRes.data as OrderWithItems[]) ?? [];
      const views = (vRes.data as PageView[]) ?? [];

      const validOrders = orders.filter((o) => o.status !== 'cancelled');
      const revenue = validOrders.reduce((s, o) => s + Number(o.total), 0);

      // COGS: sum of (order_item quantity * product cost_price)
      const productMap = new Map(products.map((p) => [p.id, p]));
      let cogs = 0;
      for (const o of validOrders) {
        for (const item of o.order_items ?? []) {
          const prod = item.product_id ? productMap.get(item.product_id) : null;
          const cost = prod ? Number(prod.cost_price) : 0;
          cogs += cost * item.quantity;
        }
      }

      const grossProfit = revenue - cogs;
      const uniqueVisitors = new Set(views.map((v) => v.visitor_id)).size;
      const aov = validOrders.length > 0 ? revenue / validOrders.length : 0;
      const conversionRate = uniqueVisitors > 0 ? (validOrders.length / uniqueVisitors) * 100 : 0;
      const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      setStats({
        products: products.length,
        orders: orders.length,
        revenue,
        cogs,
        grossProfit,
        customers: new Set(orders.map((o) => o.phone)).size,
        pending: orders.filter((o) => o.status === 'pending').length,
        pageViews: views.length,
        activeVisitors: uniqueVisitors,
        aov,
        conversionRate,
        margin,
      });
      setRecentOrders(orders.slice(0, 6));

      // Top viewed products
      const viewCounts = new Map<string, number>();
      for (const v of views) {
        if (v.product_id) {
          viewCounts.set(v.product_id, (viewCounts.get(v.product_id) ?? 0) + 1);
        }
      }
      const topIds = Array.from(viewCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      Promise.all(
        topIds.map(([id, count]) =>
          supabase.from('products').select('name').eq('id', id).maybeSingle().then(({ data }) => ({
            name: data?.name ?? 'Unknown',
            views: count,
          })),
        ),
      ).then(setTopProducts);

      // Revenue by day (last 7 days)
      const dayMap = new Map<string, { revenue: number; profit: number }>();
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { revenue: 0, profit: 0 });
      }
      for (const o of validOrders) {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        const entry = dayMap.get(key);
        if (entry) {
          entry.revenue += Number(o.total);
          let orderCogs = 0;
          for (const item of o.order_items ?? []) {
            const prod = item.product_id ? productMap.get(item.product_id) : null;
            orderCogs += (prod ? Number(prod.cost_price) : 0) * item.quantity;
          }
          entry.profit += Number(o.total) - orderCogs;
        }
      }
      setRevenueByDay(
        Array.from(dayMap.entries()).map(([date, v]) => ({
          date,
          revenue: v.revenue,
          profit: v.profit,
        })),
      );

      // Payment breakdown
      const payMap = new Map<string, { count: number; amount: number }>();
      for (const o of validOrders) {
        const entry = payMap.get(o.payment_method) ?? { count: 0, amount: 0 };
        entry.count += 1;
        entry.amount += Number(o.total);
        payMap.set(o.payment_method, entry);
      }
      setPaymentBreakdown(
        Array.from(payMap.entries()).map(([method, v]) => ({
          method: method.toUpperCase(),
          count: v.count,
          amount: v.amount,
        })),
      );

      setLoading(false);
    });
  }, []);

  const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1);
  const maxPaymentAmount = Math.max(...paymentBreakdown.map((p) => p.amount), 1);

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: DollarSign, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Gross Profit', value: formatPrice(stats.grossProfit), icon: TrendingUp, tint: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: String(stats.orders), icon: ShoppingCart, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Products', value: String(stats.products), icon: Package, tint: 'bg-purple-50 text-purple-600' },
  ];

  const pnlCards = [
    { label: 'Revenue', value: formatPrice(stats.revenue) },
    { label: 'COGS', value: formatPrice(stats.cogs) },
    { label: 'Gross Profit', value: formatPrice(stats.grossProfit) },
    { label: 'Net Margin', value: stats.margin.toFixed(1) + '%' },
    { label: 'Avg Order Value', value: formatPrice(stats.aov) },
    { label: 'Conversion Rate', value: stats.conversionRate.toFixed(1) + '%' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Dashboard</h1>
        <p className="text-sm text-[#1A1A1A]/50 mt-1">Analytics, sales, and profit overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#1A1A1A]/40">
          <TrendingUp size={20} className="animate-pulse" />
        </div>
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${c.tint}`}>
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-[#1A1A1A]">{c.value}</p>
                  <p className="text-xs text-[#1A1A1A]/50 mt-1">{c.label}</p>
                </div>
              );
            })}
          </div>

          {/* P&L section */}
          <div className="mt-6 bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
            <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-4">
              <BarChart3 size={16} /> Profit & Loss Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {pnlCards.map((c) => (
                <div key={c.label} className="text-center p-3 bg-[#FAF9F6] rounded-sm">
                  <p className="text-lg font-semibold text-[#1A1A1A]">{c.value}</p>
                  <p className="text-[0.65rem] text-[#1A1A1A]/50 mt-1 uppercase tracking-wide">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics row */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Eye size={20} />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#1A1A1A]">{stats.pageViews}</p>
                <p className="text-xs text-[#1A1A1A]/50">Page Views</p>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#1A1A1A]">{stats.activeVisitors}</p>
                <p className="text-xs text-[#1A1A1A]/50">Unique Visitors</p>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center">
                <Percent size={20} />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#1A1A1A]">{stats.customers}</p>
                <p className="text-xs text-[#1A1A1A]/50">Customers</p>
              </div>
            </div>
          </div>

          {/* Pending alert */}
          {stats.pending > 0 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-center gap-3">
              <Clock size={18} className="text-amber-600" />
              <p className="text-sm text-amber-800">
                You have <span className="font-semibold">{stats.pending}</span> pending order(s) awaiting confirmation.
              </p>
              <button onClick={() => navigate('/admin/orders')} className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline">
                View Orders
              </button>
            </div>
          )}

          {/* Charts row */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Revenue vs Profit chart */}
            <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
              <h2 className="text-sm font-medium text-[#1A1A1A] mb-4">Revenue vs Profit (7 days)</h2>
              <div className="flex items-end gap-2 h-40">
                {revenueByDay.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-full gap-0.5">
                      <div
                        className="w-full bg-[#1A1A1A] rounded-t-sm transition-all"
                        style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                        title={`Revenue: ${formatPrice(d.revenue)}`}
                      />
                      <div
                        className="w-full bg-[#C9A96E] rounded-t-sm transition-all"
                        style={{ height: `${(d.profit / maxRevenue) * 100}%`, minHeight: d.profit > 0 ? '4px' : '0' }}
                        title={`Profit: ${formatPrice(d.profit)}`}
                      />
                    </div>
                    <span className="text-[0.6rem] text-[#1A1A1A]/40">
                      {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1A1A1A] rounded-sm" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#C9A96E] rounded-sm" /> Profit</span>
              </div>
            </div>

            {/* Payment method breakdown */}
            <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
              <h2 className="text-sm font-medium text-[#1A1A1A] mb-4">Payment Method Breakdown</h2>
              {paymentBreakdown.length === 0 ? (
                <p className="text-sm text-[#1A1A1A]/40 py-8 text-center">No payment data yet.</p>
              ) : (
                <div className="space-y-4">
                  {paymentBreakdown.map((p) => (
                    <div key={p.method}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-[#1A1A1A]">{p.method}</span>
                        <span className="text-[#1A1A1A]/60">{p.count} orders · {formatPrice(p.amount)}</span>
                      </div>
                      <div className="h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A1A1A] rounded-full transition-all"
                          style={{ width: `${(p.amount / maxPaymentAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top viewed products */}
          {topProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
              <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-4">
                <Eye size={16} /> Top Viewed Products
              </h2>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center text-xs font-medium text-[#1A1A1A]">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-[#1A1A1A]">{p.name}</span>
                    <span className="text-xs text-[#1A1A1A]/50">{p.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="mt-6 bg-white rounded-sm border border-[#1A1A1A]/8">
            <div className="px-5 py-4 border-b border-[#1A1A1A]/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp size={16} /> Recent Orders
              </h2>
              <button onClick={() => navigate('/admin/orders')} className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
                View all
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#1A1A1A]/40">No orders yet.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A]/5">
                {recentOrders.map((o) => (
                  <div key={o.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF9F6]/50 cursor-pointer" onClick={() => navigate('/admin/orders')}>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{o.order_number}</p>
                      <p className="text-xs text-[#1A1A1A]/50">{o.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#1A1A1A]">{formatPrice(Number(o.total))}</p>
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 capitalize">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
