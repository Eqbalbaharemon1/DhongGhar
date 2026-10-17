import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useRouter } from '@/lib/router';

export function Footer() {
  const { navigate } = useRouter();

  const cols = [
    {
      title: 'Shop',
      links: [
        { label: 'Saree', to: '/category/saree' },
        { label: 'T-Shirt', to: '/category/t-shirt' },
        { label: 'Cosmetics', to: '/category/cosmetics' },
        { label: 'Accessories', to: '/category/accessories' },
        { label: 'All Products', to: '/shop' },
      ],
    },
    {
      title: 'Help & Info',
      links: [
        { label: 'About Us', to: '/shop' },
        { label: 'Contact', to: '/shop' },
        { label: 'Shipping & Returns', to: '/shop' },
        { label: 'Privacy Policy', to: '/shop' },
        { label: 'Terms & Conditions', to: '/shop' },
        { label: 'FAQ', to: '/shop' },
      ],
    },
  ];

  return (
    <footer className="bg-[#1A1A1A] text-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-2xl tracking-[0.18em] font-semibold">
                DHONG GHAR
              </span>
              <span className="text-[0.6rem] tracking-[0.3em] text-[#FAF9F6]/50 mt-1">
                ঢং ঘর · FASHION
              </span>
            </div>
            <p className="mt-5 text-sm text-[#FAF9F6]/70 max-w-sm leading-relaxed">
              Timeless elegance woven for you. Curated sarees, premium tees, beauty essentials, and
              statement accessories — crafted with intention in Bangladesh.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-[#FAF9F6]/20 flex items-center justify-center hover:bg-[#FAF9F6] hover:text-[#1A1A1A] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-[#FAF9F6]/20 flex items-center justify-center hover:bg-[#FAF9F6] hover:text-[#1A1A1A] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/50 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => navigate(l.to)}
                      className="text-sm text-[#FAF9F6]/80 hover:text-[#FAF9F6] transition-colors"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#FAF9F6]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-5 text-xs text-[#FAF9F6]/60">
            <span className="flex items-center gap-2">
              <Phone size={13} /> +880 1700 000000
            </span>
            <span className="flex items-center gap-2">
              <Mail size={13} /> hello@dhongghar.com
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={13} /> Dhaka, Bangladesh
            </span>
          </div>
          <p className="text-xs text-[#FAF9F6]/40">
            © {new Date().getFullYear()} Dhong Ghar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
