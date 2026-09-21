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
    <header className="sticky top-0 z-40 border-b border-ember-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🌸
          </span>
          <span className="font-display text-xl font-semibold text-ember-700">Amaranta</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-900/80">
          <Link href="/" className="hover:text-ember-600">
            Tienda
          </Link>
          {user && (
            <Link href="/orders" className="hover:text-ember-600">
              Mis pedidos
            </Link>
          )}
          {user && (
            <Link href="/pets" className="hover:text-ember-600">
              Mis mascotas
            </Link>
          )}
          {user && (
            <Link href="/appointments" className="hover:text-ember-600">
              Mis citas
            </Link>
          )}
          {user && (user.role === 'VETERINARIAN' || user.role === 'GROOMER') && (
            <Link href="/clinic" className="hover:text-ember-600">
              Clínica
            </Link>
          )}
          {user && user.role === 'ADMIN' && (
            <Link href="/admin" className="hover:text-ember-600">
              Admin
            </Link>
          )}
          {user && user.role === 'RECEPTIONIST' && (
            <Link href="/reception" className="hover:text-ember-600">
              Recepción
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full bg-ember-500 px-4 py-2 text-white shadow-card transition hover:bg-ember-600"
          >
            <span ref={cartRef} className="inline-flex items-center gap-1.5">
              <span aria-hidden>🛒</span>
              Carrito
            </span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ocean-500 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-ink-900/70 sm:inline">Hola, {user.fullName.split(' ')[0]}</span>
              <button
                onClick={logout}
                className="rounded-full border border-ember-200 px-3 py-1.5 text-ember-700 hover:bg-ember-50"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full px-3 py-1.5 text-ember-700 hover:bg-ember-50">
                Ingresar
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-ember-500 px-3 py-1.5 text-ember-600 hover:bg-ember-50"
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
