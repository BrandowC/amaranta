'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import {
  AddMedicalRecordPayload,
  Appointment,
  AppointmentStatus,
  CustomerLookup,
  Pet,
  RegisterPetPayload,
  ServiceType,
  Species,
} from '@/lib/types';
import { Alert } from '@/components/Alert';
import { PetQrCode } from '@/components/PetQrCode';
import { translateApiError } from '@/lib/error-messages';

const SERVICE_LABEL: Record<ServiceType, string> = {
  MEDICAL_CONSULT: 'Consulta médica',
  VACCINATION: 'Vacunación',
  GROOMING: 'Peluquería',
  SURGERY: 'Cirugía',
  EMERGENCY: 'Emergencia',
};

const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  OTHER: 'Otro',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

const KANBAN_COLUMNS = [
  { title: 'Pendientes', statuses: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as AppointmentStatus[] },
  { title: 'Completadas', statuses: ['COMPLETED'] as AppointmentStatus[] },
  { title: 'Canceladas', statuses: ['CANCELLED', 'NO_SHOW'] as AppointmentStatus[] },
];

function petAge(birthDate?: string): string | null {
  if (!birthDate) return null;
  const years = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? `${Math.max(1, Math.round(years * 12))} meses` : `${Math.floor(years)} años`;
}

export default function ClinicPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [pets, setPets] = useState<Record<string, Pet>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [recordFormFor, setRecordFormFor] = useState<string | null>(null);
  const [showRegisterPet, setShowRegisterPet] = useState(false);

  function loadAssigned(token: string) {
    api
      .get<Appointment[]>('/appointments/assigned', token)
      .then((data) => {
        setAppointments(data);
        const missing = [...new Set(data.map((a) => a.petId))];
        missing.forEach((petId) => {
          api
            .get<Pet>(`/pets/${petId}`, token)
            .then((pet) => setPets((prev) => ({ ...prev, [petId]: pet })))
            .catch(() => undefined);
        });
      })
      .catch((err: ApiError) => setError(translateApiError(err)));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'VETERINARIAN' && user.role !== 'GROOMER') return;
    loadAssigned(user.accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  if (!user) return null;

  if (user.role !== 'VETERINARIAN' && user.role !== 'GROOMER') {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert kind="error">Esta sección es solo para el personal de la clínica (veterinarios y peluqueros).</Alert>
      </div>
    );
  }

  async function handleComplete(appointmentId: string) {
    if (!user) return;
    setBusyId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/complete`, {}, user.accessToken);
      loadAssigned(user.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos completar la cita.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mi agenda</h1>
        {user.role === 'VETERINARIAN' && (
          <button onClick={() => setShowRegisterPet((v) => !v)} className="btn-primary-ocean">
            {showRegisterPet ? 'Cancelar' : '+ Registrar mascota'}
          </button>
        )}
      </div>

      {showRegisterPet && (
        <RegisterPetForVetForm token={user.accessToken} onRegistered={() => setShowRegisterPet(false)} />
      )}

      <PetSearchSection token={user.accessToken} />

      {error && <Alert kind="error">{error}</Alert>}

      {appointments && appointments.length === 0 && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">No tienes citas asignadas.</p>
        </div>
      )}

      {appointments && appointments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {KANBAN_COLUMNS.map((column) => {
            const columnAppointments = appointments.filter((a) => column.statuses.includes(a.status));
            return (
              <div key={column.title} className="space-y-3">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-900/50">
                  {column.title}
                  <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs text-ocean-700">
                    {columnAppointments.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {columnAppointments.map((appt) => (
                    <AppointmentCard
                      key={appt.appointmentId}
                      appointment={appt}
                      pet={pets[appt.petId]}
                      userRole={user.role}
                      token={user.accessToken}
                      busy={busyId === appt.appointmentId}
                      onComplete={() => handleComplete(appt.appointmentId)}
                      showRecordForm={recordFormFor === appt.appointmentId}
                      onOpenRecordForm={() => setRecordFormFor(appt.appointmentId)}
                      onCloseRecordForm={() => setRecordFormFor(null)}
                    />
                  ))}
                  {columnAppointments.length === 0 && (
                    <p className="rounded-xl2 bg-white/60 p-4 text-center text-xs text-ink-900/40 shadow-card">
                      Sin citas aquí
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  pet,
  userRole,
  token,
  busy,
  onComplete,
  showRecordForm,
  onOpenRecordForm,
  onCloseRecordForm,
}: {
  appointment: Appointment;
  pet?: Pet;
  userRole: string;
  token: string;
  busy: boolean;
  onComplete: () => void;
  showRecordForm: boolean;
  onOpenRecordForm: () => void;
  onCloseRecordForm: () => void;
}) {
  return (
    <div className="rounded-xl2 bg-white p-4 shadow-card">
      <h3 className="font-display text-sm font-semibold text-ink-900">
        {SERVICE_LABEL[appointment.serviceType]} — {pet?.name ?? `Mascota #${appointment.petId.slice(0, 8)}`}
      </h3>
      <p className="mt-1 text-xs text-ink-900/70">
        {new Date(appointment.scheduledAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
      {pet && (
        <p className="text-xs text-ink-900/60">
          {SPECIES_LABEL[pet.species]}
          {pet.breed && ` · ${pet.breed}`}
          {petAge(pet.birthDate) && ` · ${petAge(pet.birthDate)}`}
          {pet.ownerName && ` · Dueño: ${pet.ownerName}`}
        </p>
      )}

      {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
        <button onClick={onComplete} disabled={busy} className="btn-primary-ocean mt-3 w-full text-sm">
          {busy ? 'Completando…' : 'Marcar como completada'}
        </button>
      )}

      {appointment.status === 'COMPLETED' && userRole === 'VETERINARIAN' && (
        <div className="mt-3">
          {showRecordForm ? (
            <MedicalRecordForm
              token={token}
              appointmentId={appointment.appointmentId}
              pet={pet}
              onSaved={onCloseRecordForm}
              onCancel={onCloseRecordForm}
            />
          ) : (
            <button
              onClick={onOpenRecordForm}
              className="w-full rounded-full border border-ocean-200 px-3 py-1.5 text-sm text-ocean-600 hover:bg-ocean-50"
            >
              + Agregar historial médico
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PetSearchSection({ token }: { token: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pet[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSearching(true);
    try {
      const found = await api.get<Pet[]>(`/pets/directory?name=${encodeURIComponent(query)}`, token);
      setResults(found);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos buscar mascotas.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <button onClick={() => setOpen((v) => !v)} className="font-display text-sm font-semibold text-ocean-700">
        {open ? '− Ocultar buscador de mascotas' : '+ Buscar mascotas de la clínica'}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input flex-1"
              placeholder="Nombre de la mascota"
            />
            <button type="submit" disabled={searching} className="btn-primary-ocean">
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {error && <Alert kind="error">{error}</Alert>}

          {results && results.length === 0 && <p className="text-sm text-ink-900/50">Sin resultados.</p>}

          {results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((pet) => (
                <li key={pet.petId} className="rounded-lg border border-ink-900/10 px-3 py-2 text-sm">
                  <span className="font-medium text-ink-900">{pet.name}</span>
                  <span className="text-ink-900/60">
                    {' '}
                    — {SPECIES_LABEL[pet.species]}
                    {pet.breed && ` · ${pet.breed}`}
                    {pet.ownerName && ` · Dueño: ${pet.ownerName}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RegisterPetForVetForm({ token, onRegistered }: { token: string; onRegistered: () => void }) {
  const [email, setEmail] = useState('');
  const [owner, setOwner] = useState<CustomerLookup | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('DOG');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSearching(true);
    try {
      const found = await api.get<CustomerLookup>(`/auth/customers?email=${encodeURIComponent(email)}`, token);
      setOwner(found);
    } catch (err) {
      setError(
        err instanceof ApiError && err.statusCode === 404
          ? 'No existe un cliente con ese correo. Debe registrarse primero (en recepción o desde la app).'
          : err instanceof ApiError
            ? translateApiError(err)
            : 'No pudimos buscar al cliente.',
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!owner) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: RegisterPetPayload = { ownerId: owner.userId, name, species, breed: breed || undefined, birthDate: birthDate || undefined };
      await api.post('/pets', payload, token);
      onRegistered();
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos registrar la mascota.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      {!owner ? (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input flex-1"
            placeholder="Correo del dueño"
          />
          <button type="submit" disabled={searching} className="btn-primary-ocean">
            {searching ? 'Buscando…' : 'Buscar dueño'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-900/60">
            Dueño: <span className="font-medium text-ink-900">{owner.fullName}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nombre de la mascota" />
            <select value={species} onChange={(e) => setSpecies(e.target.value as Species)} className="input">
              {Object.entries(SPECIES_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input value={breed} onChange={(e) => setBreed(e.target.value)} className="input" placeholder="Raza (opcional)" />
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary-ocean w-full">
            {submitting ? 'Registrando…' : 'Registrar mascota'}
          </button>
        </form>
      )}

      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}

function MedicalRecordForm({
  token,
  appointmentId,
  pet,
  onSaved,
  onCancel,
}: {
  token: string;
  appointmentId: string;
  pet?: Pet;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: AddMedicalRecordPayload = {
        appointmentId,
        symptoms,
        diagnosis,
        treatment: treatment || undefined,
        notes: notes || undefined,
      };
      await api.post('/medical-records', payload, token);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err) : 'No pudimos guardar el historial médico.');
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="space-y-3 rounded-xl2 bg-cream-50 p-4">
        <Alert kind="success">Historial médico guardado correctamente.</Alert>
        {pet && <PetQrCode petId={pet.petId} />}
        <button onClick={onSaved} className="rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70">
          Listo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl2 bg-cream-50 p-4">
      {pet && (
        <p className="text-xs text-ink-900/50">
          {pet.name}
          {pet.ownerName && ` · Dueño: ${pet.ownerName}`}
          {petAge(pet.birthDate) && ` · ${petAge(pet.birthDate)}`}
        </p>
      )}
      <div>
        <label htmlFor={`symptoms-${appointmentId}`} className="mb-1 block text-sm font-medium text-ink-900/80">
          Síntomas
        </label>
        <input
          id={`symptoms-${appointmentId}`}
          required
          maxLength={1000}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="input"
          placeholder="Rascado frecuente, mal olor en el oído"
        />
      </div>
      <div>
        <label htmlFor={`diagnosis-${appointmentId}`} className="mb-1 block text-sm font-medium text-ink-900/80">
          Diagnóstico
        </label>
        <input
          id={`diagnosis-${appointmentId}`}
          required
          maxLength={1000}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="input"
          placeholder="Otitis leve en oído derecho"
        />
      </div>
      <div>
        <label htmlFor={`treatment-${appointmentId}`} className="mb-1 block text-sm font-medium text-ink-900/80">
          Tratamiento (opcional)
        </label>
        <input
          id={`treatment-${appointmentId}`}
          maxLength={1000}
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label htmlFor={`notes-${appointmentId}`} className="mb-1 block text-sm font-medium text-ink-900/80">
          Notas (opcional)
        </label>
        <input id={`notes-${appointmentId}`} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary-ocean">
          {submitting ? 'Guardando…' : 'Guardar historial'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70">
          Cancelar
        </button>
      </div>
    </form>
  );
}
