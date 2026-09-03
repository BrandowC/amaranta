'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { AuthUser } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Alert } from '@/components/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await api.post<AuthUser>('/auth/login', { email, password });
      login(user);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setError('Correo o contraseña incorrectos.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No pudimos iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Ingresa a tu cuenta</h1>
      <p className="mt-1 text-sm text-ink-900/60">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/register" className="font-medium text-amaranth-600 hover:underline">
          Regístrate
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-900/80">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="ana@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-900/80">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
