'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { MedicalRecord, Pet } from '@/lib/types';
import { Alert } from '@/components/Alert';

export default function PetDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ petId: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [history, setHistory] = useState<MedicalRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    api
      .get<Pet[]>('/pets', user.accessToken)
      .then((pets) => setPet(pets.find((p) => p.petId === params.petId) ?? null));
    api
      .get<MedicalRecord[]>(`/pets/${params.petId}/medical-history`, user.accessToken)
      .then(setHistory)
      .catch((err: ApiError) => setError(err.message));
  }, [user, authLoading, router, params.petId]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/pets" className="text-sm text-ember-600 hover:underline">
        ← Mis mascotas
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink-900">{pet?.name ?? 'Mascota'}</h1>

      {error && <Alert kind="error">{error}</Alert>}

      <h2 className="font-display text-lg font-semibold text-ink-900">Historial médico</h2>

      {history && history.length === 0 && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">Todavía no hay registros médicos para esta mascota.</p>
        </div>
      )}

      {history?.map((record) => (
        <div key={record.medicalRecordId} className="rounded-xl2 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-ink-900/50">
            <span>{new Date(record.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}</span>
          </div>
          <p className="mt-2 font-medium text-ink-900">{record.diagnosis}</p>
          {record.treatment && <p className="mt-1 text-sm text-ink-900/70">Tratamiento: {record.treatment}</p>}
          {record.notes && <p className="mt-1 text-sm text-ink-900/60">{record.notes}</p>}
        </div>
      ))}
    </div>
  );
}
