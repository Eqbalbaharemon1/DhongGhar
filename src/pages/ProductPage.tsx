import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, Zap, Check, ArrowLeft, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Review } from '@/lib/types';
import { useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { trackAddToCart, trackViewContent } from '@/lib/tracking';
import { trackPageView } from '@/lib/pageViews';
import { ProductCard } from '@/components/ProductCard';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const SAREE_SIZES = ['Free Size'];
const COSMETIC_VARIANTS = ['30ml', '50ml', '100ml'];
const ACCESSORY_VARIANTS = ['One Size'];

export function ProductPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    setSelectedVariant('');
    setAdded(false);

    supabase
      .from('products')
      .select('*, category:categories(*), product_images(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Product | null;
        setProduct(p);
        if (p) {
          const imgs = p.product_images ?? [];
          trackViewContent({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category?.name,
          });
          trackPageView(`/product/${slug}`, p.id);
          // related
          if (p.category_id) {
            supabase
              .from('products')
              .select('*, category:categories(*), product_images(*)')
              .eq('is_active', true)
              .neq('id', p.id)
              .limit(4)
              .then(({ data: r }) => setRelated((r as Product[]) ?? []));
          }
          supabase
            .from('reviews')
            .select('*')
            .eq('is_active', true)
            .eq('product_id', p.id)
            .then(({ data }) => setReviews((data as Review[]) ?? []));
        }
        setLoading(false);
      });
  }, [slug]);

  const variants = getVariants(product);
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) setSelectedVariant(variants[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleAdd = (buyNow = false) => {
    if (!product) return;
    const variant = selectedVariant || 'Standard';
    const image = product.product_images?.[0]?.image_url ?? '';
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      costPrice: Number(product.cost_price ?? 0),
      image,
      variant,
      quantity,
      stock: product.stock,
    });
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      variant,
      category: product.category?.name,
    });
    if (buyNow) {
      navigate('/checkout');
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-[3/4] bg-[#1A1A1A]/5 rounded-sm" />
          <div className="space-y-4">
            <div className="h-8 bg-[#1A1A1A]/5 rounded w-3/4" />
            <div className="h-6 bg-[#1A1A1A]/5 rounded w-1/3" />
            <div className="h-32 bg-[#1A1A1A]/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 pb-16 text-center mx-auto max-w-7xl px-4">
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Product not found</h1>
        <button
          onClick={() => navigate('/shop')}
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:gap-3 transition-all"
        >
          <ArrowLeft size={14} /> Back to shop
        </button>
      </div>
    );
  }

  const images = product.product_images ?? [];
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const inStock = product.stock > 0;

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="py-4 text-xs text-[#1A1A1A]/50 flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:text-[#1A1A1A]">
            Home
          </button>
          <span>/</span>
          {product.category && (
            <>
              <button
                onClick={() => navigate(`/category/${product.category!.slug}`)}
                className="hover:text-[#1A1A1A]"
              >
                {product.category.name}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 md:gap-14">
          {/* GALLERY */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-24 md:w-16 md:h-20 overflow-hidden rounded-sm border-2 transition-colors ${
                      i === activeImage ? 'border-[#1A1A1A]' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 aspect-[3/4] overflow-hidden rounded-sm bg-[#1A1A1A]/5">
              {images[activeImage] ? (
                <img
                  src={images[activeImage].image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#1A1A1A]/20">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* INFO */}
          <div className="flex flex-col">
            <span className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/50">
              {product.category?.name ?? 'Dhong Ghar'}
            </span>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A] leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl text-[#1A1A1A]">{formatPrice(Number(product.price))}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-[#1A1A1A]/40 line-through">
                    {formatPrice(Number(product.compare_at_price))}
                  </span>
                  <span className="text-xs bg-[#1A1A1A] text-[#FAF9F6] px-2 py-1 rounded-sm">
                    Save {formatPrice(Number(product.compare_at_price) - Number(product.price))}
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              {inStock ? (
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check size={14} /> In stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-600">Out of stock</span>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mt-6">
                <label className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A]/60">
                  {product.category?.slug === 'cosmetics' ? 'Size' : 'Size'}
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`min-w-12 px-4 py-2 text-sm border rounded-sm transition-colors ${
                        selectedVariant === v
                          ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FAF9F6]'
                          : 'border-[#1A1A1A]/20 text-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <label className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A]/60">
                Quantity
              </label>
              <div className="mt-2 inline-flex items-center border border-[#1A1A1A]/20 rounded-sm">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                  aria-label="Decrease"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="p-2.5 text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                  aria-label="Increase"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Actions — desktop */}
            <div className="mt-8 hidden sm:flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleAdd(false)}
                disabled={!inStock}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-[#1A1A1A] text-[#1A1A1A] py-3.5 text-sm tracking-wide hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {added ? (
                  <>
                    <Check size={16} /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={() => handleAdd(true)}
                disabled={!inStock}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] py-3.5 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap size={16} /> Buy Now
              </button>
            </div>

            {/* Description */}
            <div className="mt-10 pt-8 border-t border-[#1A1A1A]/10">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A]/60 mb-3">
                Description
              </h3>
              <p className="text-sm text-[#1A1A1A]/80 leading-relaxed whitespace-pre-line">
                {product.description ?? 'No description available.'}
              </p>
            </div>

            {product.sku && (
              <p className="mt-6 text-xs text-[#1A1A1A]/40">SKU: {product.sku}</p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#1A1A1A]/10">
            <h2 className="font-serif text-2xl text-[#1A1A1A] mb-6">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 border border-[#1A1A1A]/10 rounded-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A1A1A]">{r.customer_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-[#C9A96E] text-[#C9A96E]" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[#1A1A1A]/70 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#1A1A1A]/10">
            <h2 className="font-serif text-2xl text-[#1A1A1A] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile action bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF9F6] border-t border-[#1A1A1A]/10 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex-1">
          <p className="text-[0.65rem] text-[#1A1A1A]/50 uppercase tracking-wide">
            {inStock ? 'In stock' : 'Out of stock'}
          </p>
          <p className="text-sm font-semibold text-[#1A1A1A]">{formatPrice(Number(product.price))}</p>
        </div>
        <button
          onClick={() => handleAdd(false)}
          disabled={!inStock}
          className="inline-flex items-center justify-center gap-1.5 border border-[#1A1A1A] text-[#1A1A1A] px-4 py-2.5 text-xs tracking-wide rounded-sm disabled:opacity-40"
        >
          {added ? <Check size={14} /> : <ShoppingBag size={14} />}
          {added ? 'Added' : 'Cart'}
        </button>
        <button
          onClick={() => handleAdd(true)}
          disabled={!inStock}
          className="inline-flex items-center justify-center gap-1.5 bg-[#1A1A1A] text-[#FAF9F6] px-4 py-2.5 text-xs tracking-wide rounded-sm disabled:opacity-40"
        >
          <Zap size={14} /> Buy Now
        </button>
      </div>
    </div>
  );
}

function getVariants(product: Product | null): string[] {
  if (!product) return [];
  const cat = product.category?.slug;
  if (cat === 'saree') return SAREE_SIZES;
  if (cat === 't-shirt') return SIZES;
  if (cat === 'cosmetics') return COSMETIC_VARIANTS;
  if (cat === 'accessories') return ACCESSORY_VARIANTS;
  return [];
}
