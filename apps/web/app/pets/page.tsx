'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { Pet, Species } from '@/lib/types';
import { Alert } from '@/components/Alert';
import { translateApiError } from '@/lib/error-messages';

const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

/**
 * Read-only for the owner — only a veterinarian registers a pet (from /clinic), so this page
 * never offers a "create" action.
 */
export default function PetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    api
      .get<Pet[]>('/pets', user.accessToken)
      .then(setPets)
      .catch((err: ApiError) => setError(translateApiError(err)));
  }, [user, authLoading, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Mis mascotas</h1>

      {error && <Alert kind="error">{error}</Alert>}

      {pets && pets.length === 0 && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">
            Todavía no tienes mascotas registradas. Pídele al veterinario que la registre en tu próxima visita.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pets?.map((pet) => (
          <Link
            key={pet.petId}
            href={`/pets/${pet.petId}`}
            className="block rounded-xl2 bg-white p-5 shadow-card transition hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">{pet.name}</h2>
              <span className="rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-600">
                {SPECIES_LABEL[pet.species]}
              </span>
            </div>
            <dl className="mt-2 space-y-0.5 text-sm text-ink-900/60">
              {pet.breed && <p>{pet.breed}</p>}
              {pet.weightKg && <p>{pet.weightKg} kg</p>}
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
