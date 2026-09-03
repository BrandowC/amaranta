'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFlyToCart } from '@/lib/fly-to-cart-context';

export function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { registerCartTarget } = useFlyToCart();
  const cartRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerCartTarget(cartRef.current);
  }, [registerCartTarget]);

  return (
    <header className="sticky top-0 z-40 border-b border-amaranth-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🌸
          </span>
          <span className="font-display text-xl font-semibold text-amaranth-700">Amaranta</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-900/80">
          <Link href="/" className="hover:text-amaranth-600">
            Tienda
          </Link>
          {user && (
            <Link href="/orders" className="hover:text-amaranth-600">
              Mis pedidos
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full bg-amaranth-500 px-4 py-2 text-white shadow-card transition hover:bg-amaranth-600"
          >
            <span ref={cartRef} className="inline-flex items-center gap-1.5">
              <span aria-hidden>🛒</span>
              Carrito
            </span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sage-500 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-ink-900/70 sm:inline">Hola, {user.fullName.split(' ')[0]}</span>
              <button
                onClick={logout}
                className="rounded-full border border-amaranth-200 px-3 py-1.5 text-amaranth-700 hover:bg-amaranth-50"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full px-3 py-1.5 text-amaranth-700 hover:bg-amaranth-50">
                Ingresar
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-amaranth-500 px-3 py-1.5 text-amaranth-600 hover:bg-amaranth-50"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
