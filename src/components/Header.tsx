import { useEffect, useState } from 'react';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';

export function Header() {
  const { navigate, path } = useRouter();
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Saree', to: '/category/saree' },
    { label: 'T-Shirt', to: '/category/t-shirt' },
    { label: 'Cosmetics', to: '/category/cosmetics' },
    { label: 'Accessories', to: '/category/accessories' },
  ];

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  const isActive = (to: string) => (to === '/' ? path === '/' : path.startsWith(to));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF9F6]/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]'
          : 'bg-[#FAF9F6]/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -ml-2 text-[#1A1A1A]"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <button
            onClick={() => go('/')}
            className="flex flex-col items-center md:items-start leading-none"
          >
            <span className="font-serif text-xl md:text-2xl tracking-[0.18em] text-[#1A1A1A] font-semibold">
              DHONG GHAR
            </span>
            <span className="text-[0.6rem] tracking-[0.3em] text-[#1A1A1A]/60 mt-0.5">
              ঢং ঘর · FASHION
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <button
                key={l.to}
                onClick={() => go(l.to)}
                className={`text-sm tracking-wide transition-colors hover:text-[#1A1A1A] ${
                  isActive(l.to) ? 'text-[#1A1A1A] font-medium' : 'text-[#1A1A1A]/70'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="p-2 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors"
              onClick={() => go('/shop')}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <button
              className="relative p-2 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors"
              onClick={() => go('/cart')}
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1A1A1A] text-[#FAF9F6] text-[0.6rem] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#1A1A1A]/10 bg-[#FAF9F6]">
          <nav className="flex flex-col px-4 py-3">
            {links.map((l) => (
              <button
                key={l.to}
                onClick={() => go(l.to)}
                className={`text-left py-3 text-sm border-b border-[#1A1A1A]/5 last:border-0 ${
                  isActive(l.to) ? 'text-[#1A1A1A] font-medium' : 'text-[#1A1A1A]/70'
                }`}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => go('/admin')}
              className="text-left py-3 text-sm text-[#1A1A1A]/50"
            >
              Admin Panel
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
