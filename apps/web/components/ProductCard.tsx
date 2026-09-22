'use client';

import { useRef, useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useFlyToCart } from '@/lib/fly-to-cart-context';

const CATEGORY_LABEL: Record<string, string> = {
  FOOD: 'Alimento',
  ACCESSORIES: 'Accesorios',
  HYGIENE: 'Higiene',
  MEDICATION: 'Medicamento',
  TOYS: 'Juguetes',
};

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { flyToCart } = useFlyToCart();
  const [justAdded, setJustAdded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  function handleAdd() {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);

    if (imageRef.current) {
      flyToCart(imageRef.current, () => add(product, 1));
    } else {
      add(product, 1);
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl2 bg-white shadow-card ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-ember-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ember-700">
          {CATEGORY_LABEL[product.category] ?? product.category}
        </span>
        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink-900/60 text-sm font-semibold text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold text-ink-900">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-ink-900/60">{product.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-ember-700">{product.priceFormatted}</span>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="rounded-full bg-ocean-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:cursor-not-allowed disabled:bg-ink-900/20"
          >
            {justAdded ? '¡Agregado!' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
