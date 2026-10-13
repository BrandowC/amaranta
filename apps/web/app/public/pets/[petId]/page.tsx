'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { PublicPetHistory, Species } from '@/lib/types';
import { Alert } from '@/components/Alert';
import { translateApiError } from '@/lib/error-messages';

const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

/**
 * No login, no Navbar-guarded layout assumptions — this is the page a QR code or a shared link
 * opens directly. Anyone holding the pet's id can view its history; there is no owner check.
 */
export default function PublicPetHistoryPage() {
  const params = useParams<{ petId: string }>();
  const [data, setData] = useState<PublicPetHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PublicPetHistory>(`/public/pets/${params.petId}/medical-history`)
      .then(setData)
      .catch((err: ApiError) => setError(translateApiError(err)));
  }, [params.petId]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {error && <Alert kind="error">{error}</Alert>}

      {data && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{data.pet.name}</h1>
          <p className="text-sm text-ink-900/60">
            {SPECIES_LABEL[data.pet.species]}
            {data.pet.breed && ` · ${data.pet.breed}`}
          </p>

          <h2 className="font-display text-lg font-semibold text-ink-900">Historial médico</h2>

          {data.records.length === 0 && (
            <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
              <p className="text-ink-900/60">Todavía no hay registros médicos para esta mascota.</p>
            </div>
          )}

          {data.records.map((record) => (
            <div key={record.medicalRecordId} className="rounded-xl2 bg-white p-5 shadow-card">
              <p className="text-xs text-ink-900/50">
                {new Date(record.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </p>
              <p className="mt-2 text-sm text-ink-900/70">Síntomas: {record.symptoms}</p>
              <p className="mt-1 font-medium text-ink-900">{record.diagnosis}</p>
              {record.treatment && <p className="mt-1 text-sm text-ink-900/70">Tratamiento: {record.treatment}</p>}
              {record.notes && <p className="mt-1 text-sm text-ink-900/60">{record.notes}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
