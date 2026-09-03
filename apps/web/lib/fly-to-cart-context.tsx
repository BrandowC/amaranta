'use client';

import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FlyItem {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
}

interface FlyToCartContextValue {
  registerCartTarget: (el: HTMLElement | null) => void;
  /** Starts the bubble animation from originEl to the cart icon; calls onArrive when it lands. */
  flyToCart: (originEl: HTMLElement, onArrive: () => void) => void;
}

const FlyToCartContext = createContext<FlyToCartContextValue | undefined>(undefined);

const BUBBLE_SIZE = 26;
const DURATION_MS = 650;

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const cartTargetRef = useRef<HTMLElement | null>(null);
  const [items, setItems] = useState<FlyItem[]>([]);
  const nextId = useRef(0);

  function registerCartTarget(el: HTMLElement | null) {
    cartTargetRef.current = el;
  }

  function flyToCart(originEl: HTMLElement, onArrive: () => void) {
    const cartEl = cartTargetRef.current;
    if (!cartEl) {
      onArrive();
      return;
    }

    const originRect = originEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    const startX = originRect.left + originRect.width / 2;
    const startY = originRect.top + originRect.height / 2;
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;
    // Elevated control point so the bubble arcs up instead of sliding in a straight line.
    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 100;

    const id = nextId.current++;
    setItems((prev) => [...prev, { id, startX, startY, midX, midY, endX, endY }]);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      onArrive();
      cartEl.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
        { duration: 350, easing: 'ease-out' },
      );
    }, DURATION_MS);
  }

  return (
    <FlyToCartContext.Provider value={{ registerCartTarget, flyToCart }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX - BUBBLE_SIZE / 2,
                y: item.startY - BUBBLE_SIZE / 2,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: [item.startX - BUBBLE_SIZE / 2, item.midX - BUBBLE_SIZE / 2, item.endX - BUBBLE_SIZE / 2],
                y: [item.startY - BUBBLE_SIZE / 2, item.midY - BUBBLE_SIZE / 2, item.endY - BUBBLE_SIZE / 2],
                opacity: [1, 1, 0.6],
                scale: [1, 1.15, 0.4],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: DURATION_MS / 1000, ease: [0.33, 1, 0.68, 1] }}
              className="fixed left-0 top-0 flex items-center justify-center rounded-full bg-amaranth-500 text-xs shadow-lg ring-2 ring-white"
              style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
            >
              🐾
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart(): FlyToCartContextValue {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider');
  return ctx;
}
