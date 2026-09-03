'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from './types';

const STORAGE_KEY = 'amaranta.cart';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  totalItems: number;
  totalAmount: number;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLines(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    }
  }, [lines, hydrated]);

  function add(product: Product, quantity = 1) {
    setLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      const available = product.stockQuantity;
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, available);
        return prev.map((line) => (line.product.id === product.id ? { ...line, quantity: nextQuantity } : line));
      }
      return [...prev, { product, quantity: Math.min(quantity, available) }];
    });
  }

  function remove(productId: string) {
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((prev) =>
      prev
        .map((line) => (line.product.id === productId ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  function clear() {
    setLines([]);
  }

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalAmount = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, totalItems, totalAmount, add, remove, setQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
