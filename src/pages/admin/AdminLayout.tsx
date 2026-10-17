import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'banners'
  | 'settings'
  | 'profile';

export function AdminLayout({
  section,
  children,
}: {
  section: AdminSection;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { key: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories', icon: FolderTree },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'banners', label: 'Banners', icon: Image },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'profile', label: 'Profile & Security', icon: UserCircle },
  ];

  const go = (key: AdminSection) => {
    navigate(`/admin/${key}`);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#1A1A1A] text-[#FAF9F6] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 border-b border-[#FAF9F6]/10">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg tracking-[0.18em] font-semibold">
              DHONG GHAR
            </span>
            <span className="text-[0.55rem] tracking-[0.3em] text-[#FAF9F6]/50 mt-1">
              ঢং ঘর · ADMIN
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  active
                    ? 'bg-[#FAF9F6]/10 text-[#FAF9F6]'
                    : 'text-[#FAF9F6]/60 hover:text-[#FAF9F6] hover:bg-[#FAF9F6]/5'
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#FAF9F6]/10 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-[#FAF9F6]/60 hover:text-[#FAF9F6] hover:bg-[#FAF9F6]/5 transition-colors"
          >
            <ExternalLink size={17} /> View Store
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-[#FAF9F6]/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#1A1A1A] text-[#FAF9F6] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="font-serif text-sm tracking-[0.18em] font-semibold">DHONG GHAR</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
