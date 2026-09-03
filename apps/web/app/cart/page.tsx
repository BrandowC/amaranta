'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { CheckoutPayload, FulfillmentMethod, Order, PaymentMethod } from '@/lib/types';
import { formatCOP } from '@/lib/format';
import { Alert } from '@/components/Alert';

type Step = 'cart' | 'fulfillment' | 'details' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'cart', label: 'Carrito' },
  { id: 'fulfillment', label: 'Entrega' },
  { id: 'details', label: 'Datos' },
  { id: 'review', label: 'Confirmar' },
];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

export default function CartPage() {
  const { lines, totalAmount, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('cart');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // `user` loads asynchronously from localStorage after the first render, so the
  // initial useState above can't see it yet — sync it in once it's available.
  useEffect(() => {
    if (user && !contactName) {
      setContactName(user.fullName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  function goToFulfillment() {
    if (!user) {
      router.push('/login');
      return;
    }
    setStep('fulfillment');
  }

  function chooseFulfillment(method: FulfillmentMethod) {
    setFulfillmentMethod(method);
    setStep('details');
  }

  function goToReview() {
    setDetailsError(null);
    if (!contactName.trim() || !contactPhone.trim()) {
      setDetailsError('Nombre y celular son obligatorios.');
      return;
    }
    if (fulfillmentMethod === 'DELIVERY' && !deliveryAddress.trim()) {
      setDetailsError('La dirección es obligatoria para entregas a domicilio.');
      return;
    }
    setStep('review');
  }

  async function handleConfirm() {
    if (!user || !fulfillmentMethod) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: CheckoutPayload = {
        items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        fulfillmentMethod,
        paymentMethod,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        ...(fulfillmentMethod === 'DELIVERY' ? { deliveryAddress: deliveryAddress.trim() } : {}),
      };
      const order = await api.post<Order>('/orders', payload, user.accessToken);
      setConfirmedOrder(order);
      clear();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No pudimos procesar tu pedido. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl2 bg-white p-10 text-center shadow-card">
        <span className="text-4xl" aria-hidden>
          🛒
        </span>
        <h1 className="font-display text-xl font-semibold text-ink-900">Tu carrito está vacío</h1>
        <p className="text-ink-900/60">Explora el catálogo y agrega productos para tu mascota.</p>
        <Link href="/" className="btn-primary inline-block">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Stepper current={step} />

      {step === 'cart' && (
        <CartStep
          lines={lines}
          totalAmount={totalAmount}
          setQuantity={setQuantity}
          remove={remove}
          user={!!user}
          onContinue={goToFulfillment}
        />
      )}

      {step === 'fulfillment' && <FulfillmentStep onChoose={chooseFulfillment} onBack={() => setStep('cart')} />}

      {step === 'details' && fulfillmentMethod && (
        <DetailsStep
          fulfillmentMethod={fulfillmentMethod}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          contactName={contactName}
          setContactName={setContactName}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          error={detailsError}
          onBack={() => setStep('fulfillment')}
          onContinue={goToReview}
        />
      )}

      {step === 'review' && fulfillmentMethod && (
        <ReviewStep
          lines={lines}
          totalAmount={totalAmount}
          fulfillmentMethod={fulfillmentMethod}
          paymentMethod={paymentMethod}
          contactName={contactName}
          contactPhone={contactPhone}
          deliveryAddress={deliveryAddress}
          error={error}
          submitting={submitting}
          onBack={() => setStep('details')}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center justify-between">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                i <= currentIndex ? 'bg-amaranth-500 text-white' : 'bg-amaranth-100 text-amaranth-400'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs font-medium ${i <= currentIndex ? 'text-amaranth-700' : 'text-ink-900/40'}`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 h-0.5 flex-1 ${i < currentIndex ? 'bg-amaranth-500' : 'bg-amaranth-100'}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

function CartStep({
  lines,
  totalAmount,
  setQuantity,
  remove,
  user,
  onContinue,
}: {
  lines: ReturnType<typeof useCart>['lines'];
  totalAmount: number;
  setQuantity: (id: string, qty: number) => void;
  remove: (id: string) => void;
  user: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Tu carrito</h1>
      {lines.map((line) => (
        <div key={line.product.id} className="flex items-center gap-4 rounded-xl2 bg-white p-4 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={line.product.imageUrl}
            alt={line.product.name}
            className="h-20 w-20 shrink-0 rounded-lg bg-amaranth-50 object-cover"
          />
          <div className="flex-1">
            <p className="font-display font-semibold text-ink-900">{line.product.name}</p>
            <p className="text-sm text-ink-900/60">{line.product.priceFormatted} c/u</p>
          </div>
          <input
            type="number"
            min={1}
            max={line.product.stockQuantity}
            value={line.quantity}
            onChange={(e) => setQuantity(line.product.id, Number(e.target.value))}
            className="input w-20 text-center"
          />
          <p className="w-24 text-right font-semibold text-amaranth-700">
            {formatCOP(line.product.price * line.quantity)}
          </p>
          <button
            onClick={() => remove(line.product.id)}
            aria-label={`Quitar ${line.product.name}`}
            className="text-ink-900/40 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="rounded-xl2 bg-white p-6 shadow-card">
        <div className="flex justify-between font-display text-lg font-semibold text-ink-900">
          <span>Subtotal</span>
          <span>{formatCOP(totalAmount)}</span>
        </div>
        {!user && <Alert kind="success">Inicia sesión en el siguiente paso para finalizar tu compra.</Alert>}
        <button onClick={onContinue} className="btn-primary mt-4 w-full">
          Continuar
        </button>
      </div>
    </div>
  );
}

function FulfillmentStep({
  onChoose,
  onBack,
}: {
  onChoose: (method: FulfillmentMethod) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-ink-900">¿Cómo quieres tu pedido?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onChoose('DELIVERY')}
          className="flex flex-col items-center gap-2 rounded-xl2 border-2 border-transparent bg-white p-8 text-center shadow-card transition hover:border-amaranth-400"
        >
          <span className="text-4xl" aria-hidden>
            🚚
          </span>
          <span className="font-display font-semibold text-ink-900">A domicilio</span>
          <span className="text-sm text-ink-900/60">Lo llevamos a tu dirección</span>
        </button>
        <button
          onClick={() => onChoose('PICKUP')}
          className="flex flex-col items-center gap-2 rounded-xl2 border-2 border-transparent bg-white p-8 text-center shadow-card transition hover:border-amaranth-400"
        >
          <span className="text-4xl" aria-hidden>
            🏪
          </span>
          <span className="font-display font-semibold text-ink-900">Recoger en tienda</span>
          <span className="text-sm text-ink-900/60">Sin costo adicional</span>
        </button>
      </div>
      <button onClick={onBack} className="text-sm font-medium text-amaranth-600 hover:underline">
        ← Volver al carrito
      </button>
    </div>
  );
}

function DetailsStep({
  fulfillmentMethod,
  paymentMethod,
  setPaymentMethod,
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  deliveryAddress,
  setDeliveryAddress,
  error,
  onBack,
  onContinue,
}: {
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  contactName: string;
  setContactName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  error: string | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl2 bg-white p-6 shadow-card">
      <h2 className="font-display text-xl font-semibold text-ink-900">Tus datos</h2>

      <div>
        <label htmlFor="contactName" className="mb-1 block text-sm font-medium text-ink-900/80">
          Nombre completo
        </label>
        <input
          id="contactName"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="input"
          placeholder="Ana Torres"
        />
      </div>

      <div>
        <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium text-ink-900/80">
          Celular
        </label>
        <input
          id="contactPhone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="input"
          placeholder="3001234567"
        />
      </div>

      {fulfillmentMethod === 'DELIVERY' && (
        <div>
          <label htmlFor="deliveryAddress" className="mb-1 block text-sm font-medium text-ink-900/80">
            Dirección de entrega
          </label>
          <input
            id="deliveryAddress"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="input"
            placeholder="Calle 10 # 5-20, Barrio, ciudad"
          />
        </div>
      )}

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-ink-900/80">Método de pago</legend>
        <div className="space-y-2">
          {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-900/10 px-4 py-3 has-[:checked]:border-amaranth-400 has-[:checked]:bg-amaranth-50"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="accent-amaranth-500"
              />
              <span className="text-sm font-medium text-ink-900">{PAYMENT_LABEL[method]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-secondary flex-1">
          Atrás
        </button>
        <button onClick={onContinue} className="btn-primary flex-1">
          Continuar
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  lines,
  totalAmount,
  fulfillmentMethod,
  paymentMethod,
  contactName,
  contactPhone,
  deliveryAddress,
  error,
  submitting,
  onBack,
  onConfirm,
}: {
  lines: ReturnType<typeof useCart>['lines'];
  totalAmount: number;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl2 bg-white p-6 shadow-card">
      <h2 className="font-display text-xl font-semibold text-ink-900">Confirma tu pedido</h2>

      <ul className="space-y-1 text-sm text-ink-900/70">
        {lines.map((line) => (
          <li key={line.product.id} className="flex justify-between">
            <span>
              {line.quantity} × {line.product.name}
            </span>
            <span>{formatCOP(line.product.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between border-t border-ink-900/10 pt-3 font-display text-lg font-semibold text-ink-900">
        <span>Total {fulfillmentMethod === 'PICKUP' ? '(recoges en tienda)' : '(a domicilio)'}</span>
        <span>{formatCOP(totalAmount)}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-900/70">
        <dt className="font-medium text-ink-900">Entrega</dt>
        <dd>{fulfillmentMethod === 'PICKUP' ? 'Recoger en tienda' : `A domicilio — ${deliveryAddress}`}</dd>
        <dt className="font-medium text-ink-900">Pago</dt>
        <dd>{PAYMENT_LABEL[paymentMethod]}</dd>
        <dt className="font-medium text-ink-900">Contacto</dt>
        <dd>
          {contactName} · {contactPhone}
        </dd>
      </dl>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={submitting} className="btn-secondary flex-1">
          Atrás
        </button>
        <button onClick={onConfirm} disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Procesando…' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  );
}

function OrderConfirmation({ order }: { order: Order }) {
  const whatsappText = buildWhatsappMessage(order);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl2 bg-white p-8 text-center shadow-card">
      <span className="text-4xl" aria-hidden>
        🎉
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink-900">¡Pedido confirmado!</h1>
      <p className="text-ink-900/60">
        Tu pedido <span className="font-mono">#{order.orderId.slice(0, 8)}</span> quedó registrado por{' '}
        {order.totalFormatted} —{' '}
        {order.fulfillmentMethod === 'PICKUP' ? 'para recoger en tienda' : `a domicilio en ${order.deliveryAddress}`}.
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-500 px-5 py-2.5 font-semibold text-white shadow-card transition hover:bg-sage-600"
      >
        Enviar pedido por WhatsApp
      </a>
      <p className="text-xs text-ink-900/40">
        El envío automático de la factura por correo y WhatsApp está pendiente — este entorno es local. Por ahora
        queda la confirmación del pedido y el envío manual por el botón de arriba.
      </p>

      <div className="flex justify-center gap-3 pt-2">
        <Link href="/orders" className="btn-secondary">
          Ver mis pedidos
        </Link>
        <Link href="/" className="btn-primary">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

function buildWhatsappMessage(order: Order): string {
  const lines = order.items.map((item) => `- ${item.quantity}x ${item.productName}: ${formatCOP(item.subtotal)}`);
  const deliveryLine =
    order.fulfillmentMethod === 'PICKUP' ? 'Recoger en tienda' : `A domicilio — ${order.deliveryAddress}`;

  return [
    '🧾 Pedido Amaranta',
    `Cliente: ${order.contactName} (${order.contactPhone})`,
    `Entrega: ${deliveryLine}`,
    `Pago: ${PAYMENT_LABEL[order.paymentMethod]}`,
    '',
    'Productos:',
    ...lines,
    '',
    `Total: ${order.totalFormatted}`,
    `Pedido #${order.orderId.slice(0, 8)}`,
  ].join('\n');
}
