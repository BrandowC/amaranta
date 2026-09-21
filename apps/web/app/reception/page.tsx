'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { CustomerLookup, InStoreCheckoutPayload, Order, Product, ProductListResponse, WalkInCustomerPayload } from '@/lib/types';
import { Alert } from '@/components/Alert';

interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ReceptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [user, authLoading, router]);

  if (!user) return null;

  if (user.role !== 'RECEPTIONIST') {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert kind="error">Esta sección es solo para recepción.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Venta en tienda</h1>

      <CustomerLookupSection token={user.accessToken} customer={customer} onSelect={setCustomer} />

      {customer && !order && (
        <InStoreCheckoutSection token={user.accessToken} customer={customer} onCompleted={setOrder} />
      )}

      {order && <OrderPaidSection token={user.accessToken} order={order} onOrderUpdated={setOrder} onStartOver={() => {
        setCustomer(null);
        setOrder(null);
      }} />}
    </div>
  );
}

function CustomerLookupSection({
  token,
  customer,
  onSelect,
}: {
  token: string;
  customer: CustomerLookup | null;
  onSelect: (customer: CustomerLookup) => void;
}) {
  const [email, setEmail] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotFound(false);
    setSearching(true);
    try {
      const found = await api.get<CustomerLookup>(`/auth/customers?email=${encodeURIComponent(email)}`, token);
      onSelect(found);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos buscar el cliente.');
      }
    } finally {
      setSearching(false);
    }
  }

  if (customer) {
    return (
      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <p className="text-sm text-ink-900/60">Cliente</p>
        <p className="font-display text-lg font-semibold text-ink-900">{customer.fullName}</p>
        <p className="text-sm text-ink-900/60">{customer.email}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input flex-1"
          placeholder="correo@example.com"
        />
        <button type="submit" disabled={searching} className="btn-primary">
          {searching ? 'Buscando…' : 'Buscar cliente'}
        </button>
      </form>

      {error && (
        <div className="mt-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {notFound && (
        <div className="mt-4 border-t border-ink-900/10 pt-4">
          <p className="mb-2 text-sm text-ink-900/70">No existe una cuenta con ese correo. Regístralo como cliente nuevo:</p>
          <WalkInRegisterForm token={token} initialEmail={email} onRegistered={onSelect} />
        </div>
      )}
    </div>
  );
}

function WalkInRegisterForm({
  token,
  initialEmail,
  onRegistered,
}: {
  token: string;
  initialEmail: string;
  onRegistered: (customer: CustomerLookup) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: WalkInCustomerPayload = { fullName, email, phone: phone || undefined };
      const result = await api.post<{ userId: string; fullName: string; email: string }>(
        '/auth/register-walk-in',
        payload,
        token,
      );
      onRegistered({ userId: result.userId, fullName: result.fullName, email: result.email });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos registrar al cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Nombre completo" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Correo" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="Teléfono (opcional)" />
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Registrando…' : 'Registrar cliente'}
      </button>
      {error && (
        <div className="sm:col-span-2">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
    </form>
  );
}

function InStoreCheckoutSection({
  token,
  customer,
  onCompleted,
}: {
  token: string;
  customer: CustomerLookup;
  onCompleted: (order: Order) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<ProductListResponse>('/products?pageSize=50').then((res) => setProducts(res.items));
  }, []);

  function addLine() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const total = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (cart.length === 0) {
      setError('Agrega al menos un producto.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: InStoreCheckoutPayload = {
        customerId: customer.userId,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        fulfillmentMethod: 'PICKUP',
        paymentMethod: 'CASH',
        contactName: customer.fullName,
        contactPhone,
      };
      const created = await api.post<Order>('/orders/in-store', payload, token);
      onCompleted(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear la venta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink-900">Productos</h2>

      <div className="flex gap-2">
        <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="input flex-1">
          <option value="">Selecciona un producto…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.priceFormatted}
            </option>
          ))}
        </select>
        <button type="button" onClick={addLine} className="rounded-full border border-ember-500 px-4 py-2 text-ember-600 hover:bg-ember-50">
          Agregar
        </button>
      </div>

      {cart.map((line) => (
        <div key={line.productId} className="flex items-center justify-between text-sm">
          <span>
            {line.quantity} × {line.name}
          </span>
          <div className="flex items-center gap-3">
            <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(line.price * line.quantity)}</span>
            <button type="button" onClick={() => removeLine(line.productId)} className="text-ember-600 hover:underline">
              ✕
            </button>
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <div className="flex justify-between border-t border-ink-900/10 pt-3 font-semibold text-ink-900">
          <span>Total</span>
          <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}</span>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900/80">Teléfono de contacto</label>
        <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" />
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Creando venta…' : 'Crear venta (pago en efectivo)'}
      </button>
    </form>
  );
}

function OrderPaidSection({
  token,
  order,
  onOrderUpdated,
  onStartOver,
}: {
  token: string;
  order: Order;
  onOrderUpdated: (order: Order) => void;
  onStartOver: () => void;
}) {
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkPaid() {
    setError(null);
    setMarking(true);
    try {
      const updated = await api.post<Order>(`/orders/${order.orderId}/mark-paid`, {}, token);
      onOrderUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos marcar la venta como pagada.');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-ink-900/50">#{order.orderId.slice(0, 8)}</span>
        <span className="rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">{order.status}</span>
      </div>
      <p className="mt-2 font-semibold text-ink-900">Total: {order.totalFormatted}</p>

      {error && (
        <div className="mt-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {order.status === 'PENDING' && (
          <button onClick={handleMarkPaid} disabled={marking} className="btn-primary">
            {marking ? 'Marcando…' : 'Marcar como pagada'}
          </button>
        )}
        <button onClick={onStartOver} className="rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70">
          Nueva venta
        </button>
      </div>
    </div>
  );
}
