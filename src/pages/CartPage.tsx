import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useRouter } from '@/lib/router';
import { formatPrice } from '@/lib/utils';

export function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, count } = useCart();
  const { navigate } = useRouter();

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ShoppingBag size={40} className="mx-auto text-[#1A1A1A]/20" />
        <h1 className="mt-6 font-serif text-2xl text-[#1A1A1A]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#1A1A1A]/60">
          Discover our latest collection and find something you love.
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="mt-8 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-6 py-3 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm"
        >
          Start Shopping <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-6">
          <button
            onClick={() => navigate('/shop')}
            className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A] flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={12} /> Continue shopping
          </button>
          <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A]">
            Shopping Cart <span className="text-base text-[#1A1A1A]/40">({count})</span>
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Items */}
          <div className="md:col-span-2 divide-y divide-[#1A1A1A]/10 border-y border-[#1A1A1A]/10">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variant}`} className="flex gap-4 py-5">
                <button
                  onClick={() => navigate(`/product/${item.slug}`)}
                  className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-sm bg-[#1A1A1A]/5"
                >
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </button>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <button
                        onClick={() => navigate(`/product/${item.slug}`)}
                        className="text-sm font-medium text-[#1A1A1A] text-left hover:underline"
                      >
                        {item.name}
                      </button>
                      <p className="text-xs text-[#1A1A1A]/50 mt-1">Size: {item.variant}</p>
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center border border-[#1A1A1A]/20 rounded-sm">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                        className="p-1.5 text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                        aria-label="Decrease"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                        className="p-1.5 text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                        aria-label="Increase"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variant)}
                      className="text-[#1A1A1A]/40 hover:text-red-600 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="md:col-span-1">
            <div className="sticky top-28 p-6 border border-[#1A1A1A]/10 rounded-sm bg-[#FAF9F6]">
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#1A1A1A]/70">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#1A1A1A]/70">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1A1A1A]/10 flex justify-between text-base font-medium text-[#1A1A1A]">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] py-3.5 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm"
              >
                Proceed to Checkout <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
