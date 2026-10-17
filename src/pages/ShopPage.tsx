import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/lib/types';
import { useRouter } from '@/lib/router';
import { ProductCard } from '@/components/ProductCard';
import { ArrowLeft } from 'lucide-react';

export function ShopPage({ categorySlug }: { categorySlug?: string }) {
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    setLoading(true);
    if (categorySlug) {
      supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .maybeSingle()
        .then(({ data: cat }) => {
          setCategory(cat as Category | null);
          if (cat) {
            supabase
              .from('products')
              .select('*, category:categories(*), product_images(*)')
              .eq('is_active', true)
              .eq('category_id', (cat as Category).id)
              .order('created_at', { ascending: false })
              .then(({ data }) => {
                setProducts((data as Product[]) ?? []);
                setLoading(false);
              });
          } else {
            setProducts([]);
            setLoading(false);
          }
        });
    } else {
      setCategory(null);
      supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setProducts((data as Product[]) ?? []);
          setLoading(false);
        });
    }
  }, [categorySlug]);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return Number(a.price) - Number(b.price);
    if (sort === 'price-desc') return Number(b.price) - Number(a.price);
    return 0;
  });

  const title = category?.name ?? 'All Products';

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-8">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={12} /> Back to home
          </button>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A]">{title}</h1>
          {category?.description && (
            <p className="mt-2 text-sm text-[#1A1A1A]/60 max-w-2xl">{category.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-[#1A1A1A]/10">
          <span className="text-xs text-[#1A1A1A]/50">
            {loading ? 'Loading...' : `${products.length} products`}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-xs text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm px-3 py-2 bg-[#FAF9F6] focus:outline-none focus:border-[#1A1A1A]"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#1A1A1A]/5 animate-pulse rounded-sm" />
              ))
            : sorted.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {!loading && sorted.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm text-[#1A1A1A]/60">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
