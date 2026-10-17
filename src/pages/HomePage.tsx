import { useEffect, useState } from 'react';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Banner, Category, Product, Review } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { useRouter } from '@/lib/router';

export function HomePage() {
  const { navigate } = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('banners').select('*').eq('is_active', true).order('display_order'),
      supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
      supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .eq('is_active', true)
        .eq('is_trending', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('reviews').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
    ]).then(([b, c, f, t, r]) => {
      setBanners((b.data as Banner[]) ?? []);
      setCategories((c.data as Category[]) ?? []);
      setFeatured((f.data as Product[]) ?? []);
      setTrending((t.data as Product[]) ?? []);
      setReviews((r.data as Review[]) ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div className="bg-[#FAF9F6]">
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[520px] overflow-hidden">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === heroIdx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-[#1A1A1A]/20 to-transparent" />
          </div>
        ))}

        <div className="relative z-10 h-full flex items-end">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
            <div className="max-w-2xl text-[#FAF9F6]">
              {banners[heroIdx] && (
                <>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#FAF9F6]/80 mb-4">
                    {banners[heroIdx].subtitle}
                  </p>
                  <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] font-semibold">
                    {banners[heroIdx].title}
                  </h1>
                  <button
                    onClick={() => navigate(banners[heroIdx].link_url ?? '/shop')}
                    className="mt-8 inline-flex items-center gap-2 bg-[#FAF9F6] text-[#1A1A1A] px-6 py-3 text-sm tracking-wide hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors rounded-sm"
                  >
                    Shop Now <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-6 right-6 md:right-8 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className={`h-1 rounded-full transition-all ${
                  i === heroIdx ? 'w-8 bg-[#FAF9F6]' : 'w-4 bg-[#FAF9F6]/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <SectionHeading
          eyebrow="Explore"
          title="Shop by Category"
          subtitle="From handwoven sarees to everyday essentials — find your edit."
        />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/category/${c.slug}`)}
              className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-[#1A1A1A]/5"
            >
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-left">
                <h3 className="font-serif text-lg md:text-xl text-[#FAF9F6] font-medium">
                  {c.name}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#FAF9F6]/80 group-hover:gap-2 transition-all">
                  Discover <ArrowRight size={12} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED / NEW ARRIVALS */}
      <ProductRow
        eyebrow="Just In"
        title="New Arrivals"
        subtitle="The latest pieces, freshly added to our collection."
        products={featured}
        loading={loading}
        onViewAll={() => navigate('/shop')}
      />

      {/* EDITORIAL BANNER */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/8062923/pexels-photo-8062923.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Everyday luxury"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A1A]/30" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-xl text-[#FAF9F6]">
            <p className="text-xs tracking-[0.3em] uppercase text-[#FAF9F6]/80 mb-4">
              The Dhong Ghar Promise
            </p>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight font-semibold">
              Crafted with intention. Made to last.
            </h2>
            <p className="mt-4 text-sm text-[#FAF9F6]/80 leading-relaxed">
              Every piece is selected for quality, comfort, and timeless design.
            </p>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <ProductRow
        eyebrow="Popular Now"
        title="Trending Fashion"
        subtitle="What our community is loving this season."
        products={trending}
        loading={loading}
        onViewAll={() => navigate('/shop')}
      />

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="bg-[#1A1A1A] text-[#FAF9F6] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Loved by you"
              title="Customer Stories"
              subtitle="Real reviews from the Dhong Ghar community."
              dark
            />
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-6 border border-[#FAF9F6]/15 rounded-sm bg-[#FAF9F6]/5"
                >
                  <Quote size={20} className="text-[#FAF9F6]/40" />
                  <p className="mt-3 text-sm leading-relaxed text-[#FAF9F6]/90">
                    {r.comment}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm font-medium">{r.customer_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-[#C9A96E] text-[#C9A96E]" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  dark,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p
        className={`text-xs tracking-[0.3em] uppercase mb-3 ${
          dark ? 'text-[#FAF9F6]/60' : 'text-[#1A1A1A]/50'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-serif text-3xl md:text-4xl font-semibold ${
          dark ? 'text-[#FAF9F6]' : 'text-[#1A1A1A]'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-sm ${dark ? 'text-[#FAF9F6]/70' : 'text-[#1A1A1A]/60'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ProductRow({
  eyebrow,
  title,
  subtitle,
  products,
  loading,
  onViewAll,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
  loading: boolean;
  onViewAll: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#1A1A1A]/50 mb-2">{eyebrow}</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A]">{title}</h2>
          <p className="mt-2 text-sm text-[#1A1A1A]/60">{subtitle}</p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:gap-3 transition-all"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#1A1A1A]/5 animate-pulse rounded-sm" />
            ))
          : products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
