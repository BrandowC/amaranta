'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { Pet, RegisterPetPayload, Species } from '@/lib/types';
import { Alert } from '@/components/Alert';

const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

export default function PetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function loadPets(token: string) {
    api
      .get<Pet[]>('/pets', token)
      .then(setPets)
      .catch((err: ApiError) => setError(err.message));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadPets(user.accessToken);
  }, [user, authLoading, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mis mascotas</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nueva mascota'}
        </button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {showForm && (
        <RegisterPetForm
          token={user.accessToken}
          onRegistered={() => {
            setShowForm(false);
            loadPets(user.accessToken);
          }}
        />
      )}

      {pets && pets.length === 0 && !showForm && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">Todavía no has registrado ninguna mascota.</p>
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

function RegisterPetForm({ token, onRegistered }: { token: string; onRegistered: () => void }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('DOG');
  const [breed, setBreed] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: RegisterPetPayload = {
        name,
        species,
        breed: breed || undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      };
      await api.post<Pet>('/pets', payload, token);
      onRegistered();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos registrar tu mascota. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="petName" className="mb-1 block text-sm font-medium text-ink-900/80">
            Nombre
          </label>
          <input
            id="petName"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Firulais"
          />
        </div>

        <div>
          <label htmlFor="petSpecies" className="mb-1 block text-sm font-medium text-ink-900/80">
            Especie
          </label>
          <select
            id="petSpecies"
            value={species}
            onChange={(e) => setSpecies(e.target.value as Species)}
            className="input"
          >
            {Object.entries(SPECIES_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="petBreed" className="mb-1 block text-sm font-medium text-ink-900/80">
            Raza (opcional)
          </label>
          <input id="petBreed" value={breed} onChange={(e) => setBreed(e.target.value)} className="input" placeholder="Labrador" />
        </div>

        <div>
          <label htmlFor="petWeight" className="mb-1 block text-sm font-medium text-ink-900/80">
            Peso en kg (opcional)
          </label>
          <input
            id="petWeight"
            type="number"
            min="0.01"
            step="0.01"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="input"
            placeholder="12.5"
          />
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Registrando…' : 'Registrar mascota'}
      </button>
    </form>
  );
}
