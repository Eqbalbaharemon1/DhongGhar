import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useRouter } from '@/lib/router';

export function ProductCard({ product }: { product: Product }) {
  const { navigate } = useRouter();
  const image = product.product_images?.[0]?.image_url;
  const secondImage = product.product_images?.[1]?.image_url;
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  let badge: { text: string; class: string } | null = null;
  if (product.stock === 0) {
    badge = { text: 'SOLD OUT', class: 'bg-[#FAF9F6]/90 text-[#1A1A1A]' };
  } else if (hasDiscount) {
    badge = { text: 'SALE', class: 'bg-[#1A1A1A] text-[#FAF9F6]' };
  } else if (product.is_trending) {
    badge = { text: 'BEST SELLER', class: 'bg-[#C9A96E] text-[#1A1A1A]' };
  } else if (product.is_featured) {
    badge = { text: 'NEW ARRIVAL', class: 'bg-[#1A1A1A]/80 text-[#FAF9F6]' };
  }

  return (
    <button
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group flex flex-col text-left"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1A1A1A]/5 rounded-sm">
        {image ? (
          <>
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#1A1A1A]/20 text-xs">
            No image
          </div>
        )}
        {badge && (
          <span className={`absolute top-3 left-3 text-[0.6rem] tracking-[0.15em] uppercase font-medium px-2.5 py-1 rounded-sm ${badge.class}`}>
            {badge.text}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="p-4">
            <span className="text-[0.65rem] tracking-[0.15em] uppercase text-[#FAF9F6]/90">
              View Details
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col">
        <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
          {product.category?.name ?? 'Dhong Ghar'}
        </span>
        <h3 className="mt-1 text-sm font-medium text-[#1A1A1A] leading-snug">{product.name}</h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm text-[#1A1A1A]">{formatPrice(Number(product.price))}</span>
          {hasDiscount && (
            <span className="text-xs text-[#1A1A1A]/40 line-through">
              {formatPrice(Number(product.compare_at_price))}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
