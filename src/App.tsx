import { RouterProvider, useRouter, matchRoute } from '@/lib/router';
import { CartProvider } from '@/lib/cart';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useSettings } from '@/lib/useSettings';
import { AnalyticsScripts } from '@/lib/analytics';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { ThankYouPage } from '@/pages/ThankYouPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminBanners } from '@/pages/admin/AdminBanners';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminProfile } from '@/pages/admin/AdminProfile';
import { Loader2 } from 'lucide-react';

function AdminRoute({ section }: { section: 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'banners' | 'settings' | 'profile' }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#FAF9F6]" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout section={section}>
      {section === 'dashboard' && <AdminDashboard />}
      {section === 'products' && <AdminProducts />}
      {section === 'categories' && <AdminCategories />}
      {section === 'orders' && <AdminOrders />}
      {section === 'customers' && <AdminCustomers />}
      {section === 'banners' && <AdminBanners />}
      {section === 'settings' && <AdminSettings />}
      {section === 'profile' && <AdminProfile />}
    </AdminLayout>
  );
}

function Routes() {
  const { path } = useRouter();
  const { settings } = useSettings();

  const isAdmin = path.startsWith('/admin');

  // Admin routes — no storefront chrome
  if (isAdmin) {
    if (path === '/admin') {
      return <AdminRoute section="dashboard" />;
    }
    const adminSectionMatch = matchRoute('/admin/:section', path);
    if (adminSectionMatch) {
      const section = adminSectionMatch.section as 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'banners' | 'settings' | 'profile';
      const valid = ['dashboard', 'products', 'categories', 'orders', 'customers', 'banners', 'settings', 'profile'];
      if (valid.includes(section)) {
        return <AdminRoute section={section} />;
      }
    }
    return <AdminRoute section="dashboard" />;
  }

  // Storefront routes
  let page: React.ReactNode;
  if (path === '/') {
    page = <HomePage />;
  } else if (path === '/shop') {
    page = <ShopPage />;
  } else if (matchRoute('/category/:slug', path)) {
    page = <ShopPage categorySlug={matchRoute('/category/:slug', path)!.slug} />;
  } else if (matchRoute('/product/:slug', path)) {
    page = <ProductPage slug={matchRoute('/product/:slug', path)!.slug} />;
  } else if (path === '/cart') {
    page = <CartPage />;
  } else if (path === '/checkout') {
    page = <CheckoutPage />;
  } else if (matchRoute('/thank-you/:id', path)) {
    page = <ThankYouPage orderId={matchRoute('/thank-you/:id', path)!.id} />;
  } else {
    page = <NotFound />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
      <AnalyticsScripts settings={settings} />
    </div>
  );
}

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div className="pt-32 pb-24 text-center">
      <h1 className="font-serif text-4xl text-[#1A1A1A]">404</h1>
      <p className="mt-3 text-sm text-[#1A1A1A]/60">Page not found.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-5 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90"
      >
        Back to Home
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <CartProvider>
          <Routes />
        </CartProvider>
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
