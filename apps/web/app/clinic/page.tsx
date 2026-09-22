'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { AddMedicalRecordPayload, Appointment, AppointmentStatus, Pet, ServiceType } from '@/lib/types';
import { Alert } from '@/components/Alert';

const SERVICE_LABEL: Record<ServiceType, string> = {
  MEDICAL_CONSULT: 'Consulta médica',
  VACCINATION: 'Vacunación',
  GROOMING: 'Peluquería',
  SURGERY: 'Cirugía',
  EMERGENCY: 'Emergencia',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

export default function ClinicPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [pets, setPets] = useState<Record<string, Pet>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [recordFormFor, setRecordFormFor] = useState<string | null>(null);

  function loadAssigned(token: string) {
    api
      .get<Appointment[]>('/appointments/assigned', token)
      .then((data) => {
        setAppointments(data);
        const missing = [...new Set(data.map((a) => a.petId))].filter((id) => !pets[id]);
        missing.forEach((petId) => {
          api
            .get<Pet>(`/pets/${petId}`, token)
            .then((pet) => setPets((prev) => ({ ...prev, [petId]: pet })))
            .catch(() => undefined);
        });
      })
      .catch((err: ApiError) => setError(err.message));
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
      setError(err instanceof ApiError ? err.message : 'No pudimos completar la cita.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Mi agenda</h1>

      {error && <Alert kind="error">{error}</Alert>}

      {appointments && appointments.length === 0 && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">No tienes citas asignadas.</p>
        </div>
      )}

      {appointments?.map((appt) => {
        const pet = pets[appt.petId];
        return (
          <div key={appt.appointmentId} className="rounded-xl2 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {SERVICE_LABEL[appt.serviceType]} — {pet?.name ?? `Mascota #${appt.petId.slice(0, 8)}`}
              </h2>
              <span className="rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
                {STATUS_LABEL[appt.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-900/70">
              {new Date(appt.scheduledAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            {pet?.breed && <p className="text-sm text-ink-900/60">{pet.species === 'DOG' ? 'Perro' : pet.species === 'CAT' ? 'Gato' : 'Otro'} · {pet.breed}</p>}

            {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
              <button
                onClick={() => handleComplete(appt.appointmentId)}
                disabled={busyId === appt.appointmentId}
                className="btn-primary mt-3"
              >
                {busyId === appt.appointmentId ? 'Completando…' : 'Marcar como completada'}
              </button>
            )}

            {appt.status === 'COMPLETED' && user.role === 'VETERINARIAN' && (
              <div className="mt-3">
                {recordFormFor === appt.appointmentId ? (
                  <MedicalRecordForm
                    token={user.accessToken}
                    appointmentId={appt.appointmentId}
                    onSaved={() => setRecordFormFor(null)}
                    onCancel={() => setRecordFormFor(null)}
                  />
                ) : (
                  <button
                    onClick={() => setRecordFormFor(appt.appointmentId)}
                    className="rounded-full border border-ocean-200 px-3 py-1.5 text-sm text-ocean-600 hover:bg-ocean-50"
                  >
                    + Agregar historial médico
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MedicalRecordForm({
  token,
  appointmentId,
  onSaved,
  onCancel,
}: {
  token: string;
  appointmentId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: AddMedicalRecordPayload = {
        appointmentId,
        diagnosis,
        treatment: treatment || undefined,
        notes: notes || undefined,
      };
      await api.post('/medical-records', payload, token);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos guardar el historial médico.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl2 bg-cream-50 p-4">
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
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Guardando…' : 'Guardar historial'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-ink-900/20 px-4 py-2 text-sm text-ink-900/70">
          Cancelar
        </button>
      </div>
    </form>
  );
}
