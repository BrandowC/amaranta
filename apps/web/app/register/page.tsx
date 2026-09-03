'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { AuthUser } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Alert } from '@/components/Alert';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await api.post<AuthUser>('/auth/register', { fullName, email, phone: phone || undefined, password });
      login(user);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_REGISTERED') {
        setError('Ya existe una cuenta con ese correo. Intenta iniciar sesión.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No pudimos crear tu cuenta. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-ink-900/60">Regístrate para comprar y agendar citas para tu mascota.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Nombre completo" htmlFor="fullName">
          <input
            id="fullName"
            required
            minLength={2}
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
            placeholder="Ana Torres"
          />
        </Field>

        <Field label="Correo electrónico" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="ana@example.com"
          />
        </Field>

        <Field label="Teléfono (opcional)" htmlFor="phone">
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="3001234567"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </Field>

        {error && <Alert kind="error">{error}</Alert>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-900/80">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-900/50">{hint}</p>}
    </div>
  );
}
