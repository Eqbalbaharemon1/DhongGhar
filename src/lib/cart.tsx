import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  costPrice: number;
  image: string;
  variant: string;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant: string) => void;
  updateQuantity: (productId: string, variant: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'dhong_ghar_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: CartItem) => {
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === item.productId && i.variant === item.variant,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: Math.min(next[idx].quantity + item.quantity, item.stock || 99),
          };
          return next;
        }
        return [...prev, item];
      });
    };

    const removeItem = (productId: string, variant: string) => {
      setItems((prev) =>
        prev.filter((i) => !(i.productId === productId && i.variant === variant)),
      );
    };

    const updateQuantity = (productId: string, variant: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) }
            : i,
        ),
      );
    };

    const clear = () => setItems([]);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, addItem, removeItem, updateQuantity, clear, subtotal, count };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
