'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import {
  Appointment,
  CustomerLookup,
  InStoreCheckoutPayload,
  Order,
  PaymentMethod,
  Pet,
  Product,
  ProductListResponse,
  ScheduleAppointmentPayload,
  ServiceType,
  StaffMember,
  WalkInCustomerPayload,
} from '@/lib/types';
import { Alert } from '@/components/Alert';
import { SlotPicker } from '@/components/SlotPicker';
import { translateApiError } from '@/lib/error-messages';

interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const SERVICE_LABEL: Record<ServiceType, string> = {
  MEDICAL_CONSULT: 'Consulta médica',
  VACCINATION: 'Vacunación',
  GROOMING: 'Peluquería',
  SURGERY: 'Cirugía',
  EMERGENCY: 'Emergencia',
};

type ReceptionTask = 'sale' | 'appointment';

export default function ReceptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<ReceptionTask>('sale');

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
      <h1 className="font-display text-2xl font-semibold text-ink-900">Atención al cliente</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTask('sale')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${task === 'sale' ? 'bg-ocean-500 text-white' : 'border border-ink-900/20 text-ink-900/70'}`}
        >
          Venta en tienda
        </button>
        <button
          onClick={() => setTask('appointment')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${task === 'appointment' ? 'bg-ocean-500 text-white' : 'border border-ink-900/20 text-ink-900/70'}`}
        >
          Agendar cita
        </button>
      </div>

      {task === 'sale' ? <WalkInSaleTask token={user.accessToken} /> : <AppointmentTask token={user.accessToken} />}
    </div>
  );
}

/**
 * A point-of-sale, not a mini shop: the receptionist types what the person in front of them is
 * buying and charges it — no customer search, no account required. The order is still attributed
 * to a fixed walk-in customer on the backend (so the domain's "every order has a customerId"
 * invariant holds), but that's invisible here.
 */
const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

function WalkInSaleTask({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
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
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        fulfillmentMethod: 'PICKUP',
        paymentMethod,
        contactName: contactName || 'Cliente de mostrador',
        contactPhone: contactPhone || '0000000000',
      };
      const created = await api.post<Order>('/orders/in-store', payload, token);
      setOrder(created);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos crear la venta.');
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setOrder(null);
    setCart([]);
    setContactName('');
    setContactPhone('');
  }

  if (order) {
    return <ReceiptSection token={token} order={order} onOrderUpdated={setOrder} onStartOver={startOver} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl2 bg-white p-5 shadow-card">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Productos</h2>
        <div className="mt-2 flex gap-2">
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="input flex-1">
            <option value="">Selecciona un producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.priceFormatted}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLine}
            className="rounded-full border border-ocean-500 px-4 py-2 text-sm font-medium text-ocean-600 hover:bg-ocean-50"
          >
            Agregar
          </button>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="rounded-xl2 border border-dashed border-ink-900/15 p-4">
          <ul className="divide-y divide-ink-900/5 text-sm">
            {cart.map((line) => (
              <li key={line.productId} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-ink-900/80">
                  {line.quantity} × {line.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink-900">{formatCOP(line.price * line.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    aria-label={`Quitar ${line.name}`}
                    className="text-ink-900/40 hover:text-ocean-600"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink-900/10 pt-3 font-display text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900/80">Método de pago</label>
        <div className="flex gap-2">
          {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                paymentMethod === value ? 'bg-ocean-500 text-white' : 'border border-ink-900/15 text-ink-900/70 hover:bg-ink-900/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Nombre (opcional)</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="input" placeholder="Cliente de mostrador" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Teléfono (opcional)</label>
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" />
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary-ocean w-full">
        {submitting ? 'Creando venta…' : `Cobrar (${PAYMENT_METHOD_LABEL[paymentMethod].toLowerCase()})`}
      </button>
    </form>
  );
}

function ReceiptSection({
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
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos marcar la venta como pagada.');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div id="receipt" className="rounded-xl2 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-ink-900/50">#{order.orderId.slice(0, 8)}</span>
        <span className="rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">{order.status}</span>
      </div>
      <p className="mt-1 text-xs text-ink-900/50">{new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</p>

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

      <div className="mt-3 flex items-center justify-between border-t border-ink-900/10 pt-3">
        <span className="text-xs text-ink-900/50">Pago: {PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
        <span className="font-semibold text-ink-900">Total: {order.totalFormatted}</span>
      </div>

      {error && (
        <div className="mt-3 print:hidden">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 flex gap-2 print:hidden">
        {order.status === 'PENDING' && (
          <button onClick={handleMarkPaid} disabled={marking} className="btn-primary-ocean">
            {marking ? 'Marcando…' : 'Marcar como pagada'}
          </button>
        )}
        <button onClick={() => window.print()} className="rounded-full border border-ocean-500 px-4 py-2 text-sm text-ocean-600 hover:bg-ocean-50">
          Imprimir recibo
        </button>
        <button onClick={onStartOver} className="rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70">
          Nueva venta
        </button>
      </div>
    </div>
  );
}

/**
 * Booking an appointment genuinely needs a real customer (it's tied to their pet and history),
 * so this is the only reception task that still looks one up first.
 */
function AppointmentTask({ token }: { token: string }) {
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  if (bookedAppointment) {
    return (
      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <Alert kind="success">
          Cita agendada: {SERVICE_LABEL[bookedAppointment.serviceType]} el{' '}
          {new Date(bookedAppointment.scheduledAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
        </Alert>
        <button
          onClick={() => {
            setCustomer(null);
            setBookedAppointment(null);
          }}
          className="mt-4 rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70"
        >
          Atender otro cliente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerLookupSection token={token} customer={customer} onSelect={setCustomer} />
      {customer && <AppointmentBookingSection token={token} customer={customer} onBooked={setBookedAppointment} />}
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
        setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos buscar el cliente.');
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
        <button type="submit" disabled={searching} className="btn-primary-ocean">
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
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos registrar al cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Nombre completo" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Correo" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="Teléfono (opcional)" />
      <button type="submit" disabled={submitting} className="btn-primary-ocean">
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

function AppointmentBookingSection({
  token,
  customer,
  onBooked,
}: {
  token: string;
  customer: CustomerLookup;
  onBooked: (appointment: Appointment) => void;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [petId, setPetId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('MEDICAL_CONSULT');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Pet[]>(`/pets/directory?ownerId=${customer.userId}`, token).then((found) => {
      setPets(found);
      setPetId(found[0]?.petId ?? '');
    });
    api.get<StaffMember[]>('/auth/staff', token).then(setStaff);
  }, [token, customer.userId]);

  const eligibleStaff = staff.filter((s) => (serviceType === 'GROOMING' ? s.role === 'GROOMER' : s.role === 'VETERINARIAN'));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!petId || !professionalId || !scheduledAt) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: ScheduleAppointmentPayload = {
        ownerId: customer.userId,
        petId,
        professionalId,
        serviceType,
        scheduledAt,
      };
      const created = await api.post<Appointment>('/appointments', payload, token);
      onBooked(created);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  }

  if (pets.length === 0) {
    return (
      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <p className="text-sm text-ink-900/60">
          Este cliente todavía no tiene mascotas registradas — pídale al veterinario que la registre primero.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      <p className="text-xs text-ink-900/50">Horario de atención de la clínica: 7:00 a.m. – 10:00 p.m., lunes a sábado.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Mascota</label>
          <select value={petId} onChange={(e) => setPetId(e.target.value)} className="input">
            {pets.map((pet) => (
              <option key={pet.petId} value={pet.petId}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Servicio</label>
          <select
            value={serviceType}
            onChange={(e) => {
              setServiceType(e.target.value as ServiceType);
              setProfessionalId('');
            }}
            className="input"
          >
            {Object.entries(SERVICE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">Profesional</label>
          <select
            required
            value={professionalId}
            onChange={(e) => {
              setProfessionalId(e.target.value);
              setScheduledAt('');
            }}
            className="input"
          >
            <option value="">Selecciona…</option>
            {eligibleStaff.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {professionalId && (
        <SlotPicker
          token={token}
          professionalId={professionalId}
          date={date}
          onDateChange={setDate}
          scheduledAt={scheduledAt}
          onSlotSelected={setScheduledAt}
        />
      )}

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary-ocean w-full">
        {submitting ? 'Agendando…' : 'Agendar cita'}
      </button>
    </form>
  );
}
