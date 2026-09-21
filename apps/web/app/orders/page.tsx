'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { Order } from '@/lib/types';
import { Alert } from '@/components/Alert';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente de pago',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
  FULFILLED: 'Entregado',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    api
      .get<Order[]>('/orders', user.accessToken)
      .then(setOrders)
      .catch((err: ApiError) => setError(err.message));
  }, [user, authLoading, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Mis pedidos</h1>

      {error && <Alert kind="error">{error}</Alert>}

      {orders && orders.length === 0 && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">Todavía no tienes pedidos.</p>
          <Link href="/" className="btn-primary mt-4 inline-block">
            Ir a la tienda
          </Link>
        </div>
      )}

      {orders?.map((order) => (
        <div key={order.orderId} className="rounded-xl2 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-ink-900/50">#{order.orderId.slice(0, 8)}</span>
            <span className="rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-ink-900/70">
            {order.items.map((line) => (
              <li key={line.productId} className="flex justify-between">
                <span>
                  {line.quantity} × {line.productName}
                </span>
                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(line.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink-900/10 pt-3 font-semibold text-ink-900">
            <span>Total</span>
            <span>{order.totalFormatted}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
