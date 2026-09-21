'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { AdminProduct, AdminProductListResponse, CreateProductPayload, ProductCategory } from '@/lib/types';
import { Alert } from '@/components/Alert';

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  FOOD: 'Alimento',
  ACCESSORIES: 'Accesorios',
  HYGIENE: 'Higiene',
  MEDICATION: 'Medicamento',
  TOYS: 'Juguetes',
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function loadProducts(token: string) {
    api
      .get<AdminProductListResponse>('/admin/products?pageSize=50', token)
      .then((res) => setProducts(res.items))
      .catch((err: ApiError) => setError(err.message));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') return;
    loadProducts(user.accessToken);
  }, [user, authLoading, router]);

  if (!user) return null;

  if (user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-4xl">
        <Alert kind="error">Esta sección es solo para administradores.</Alert>
      </div>
    );
  }

  async function toggleActive(product: AdminProduct) {
    if (!user) return;
    setBusyId(product.id);
    try {
      const action = product.isActive ? 'deactivate' : 'activate';
      await api.post(`/admin/products/${product.id}/${action}`, {}, user.accessToken);
      loadProducts(user.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos actualizar el producto.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Administrar catálogo</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {showForm && (
        <CreateProductForm
          token={user.accessToken}
          onCreated={() => {
            setShowForm(false);
            loadProducts(user.accessToken);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-900/10 text-ink-900/60">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-ink-900/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-ink-900/60">{product.sku}</td>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">{CATEGORY_LABEL[product.category]}</td>
                <td className="px-4 py-3">{product.priceFormatted}</td>
                <td className="px-4 py-3">
                  <StockEditor
                    token={user.accessToken}
                    productId={product.id}
                    initialValue={product.stockQuantity}
                    onSaved={() => loadProducts(user.accessToken)}
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      product.isActive ? 'bg-ocean-50 text-ocean-600' : 'bg-ink-900/5 text-ink-900/50'
                    }`}
                  >
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={busyId === product.id}
                    className="text-xs font-semibold text-ember-600 hover:underline"
                  >
                    {product.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockEditor({
  token,
  productId,
  initialValue,
  onSaved,
}: {
  token: string;
  productId: string;
  initialValue: number;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);

  async function save() {
    const stockQuantity = Number(value);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity === initialValue) return;
    setSaving(true);
    try {
      await api.patch(`/admin/products/${productId}/stock`, { stockQuantity }, token);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      className="w-20 rounded-lg border border-ink-900/15 px-2 py-1"
    />
  );
}

function CreateProductForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateProductPayload = {
        sku,
        name,
        description,
        category,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        imageUrl,
      };
      await api.post('/admin/products', payload, token);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear el producto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">SKU</label>
          <input required value={sku} onChange={(e) => setSku(e.target.value)} className="input" placeholder="FOOD-DOG-001" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Nombre</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Descripción</label>
          <input required value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)} className="input">
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Precio (COP)</label>
          <input required type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Stock inicial</label>
          <input
            required
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">URL de imagen</label>
          <input
            required
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input"
            placeholder="https://…"
          />
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Creando…' : 'Crear producto'}
      </button>
    </form>
  );
}
