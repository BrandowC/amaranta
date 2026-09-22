'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { ProductListResponse } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Alert } from '@/components/Alert';
import { InteractiveHero } from '@/components/InteractiveHero';

export default function ShopPage() {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ProductListResponse>('/products?page=1&pageSize=50')
      .then(setData)
      .catch((err: ApiError) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid items-center gap-8 rounded-xl2 bg-gradient-to-br from-ember-500 to-ember-700 px-6 py-10 text-white shadow-card sm:px-10 md:grid-cols-2">
        <div>
          <p className="font-display text-sm uppercase tracking-widest text-ember-100">Amaranta Shop</p>
          <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold sm:text-4xl">
            Todo lo que tu mascota necesita, en un solo lugar
          </h1>
          <p className="mt-3 max-w-lg text-ember-50/90">
            Alimento, accesorios, higiene y más — con retiro en nuestra tienda física.
          </p>
        </div>
        <InteractiveHero variant="shop" side="right" className="hidden max-w-sm justify-self-end md:block" />
      </section>

      {loading && <SkeletonGrid />}

      {error && <Alert kind="error">No pudimos cargar el catálogo: {error}</Alert>}

      {data && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">Catálogo</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {data.items.length === 0 && (
            <p className="text-ink-900/60">Todavía no hay productos activos en el catálogo.</p>
          )}
        </section>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl2 bg-ember-100/60" />
      ))}
    </div>
  );
}
