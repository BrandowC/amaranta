'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { Appointment, AppointmentStatus, Pet, ScheduleAppointmentPayload, ServiceType, StaffMember } from '@/lib/types';
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

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function loadAppointments(token: string) {
    api
      .get<Appointment[]>('/appointments', token)
      .then(setAppointments)
      .catch((err: ApiError) => setError(err.message));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadAppointments(user.accessToken);
    api.get<Pet[]>('/pets', user.accessToken).then(setPets);
    api.get<StaffMember[]>('/auth/staff', user.accessToken).then(setStaff);
  }, [user, authLoading, router]);

  async function handleCancel(appointmentId: string) {
    if (!user) return;
    setCancellingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/cancel`, {}, user.accessToken);
      loadAppointments(user.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cancelar la cita.');
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mis citas</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary" disabled={pets.length === 0}>
          {showForm ? 'Cancelar' : '+ Agendar cita'}
        </button>
      </div>

      {pets.length === 0 && !showForm && (
        <Alert kind="error">Primero debes registrar una mascota para poder agendar una cita.</Alert>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      {showForm && (
        <ScheduleAppointmentForm
          token={user.accessToken}
          pets={pets}
          staff={staff}
          onScheduled={() => {
            setShowForm(false);
            loadAppointments(user.accessToken);
          }}
        />
      )}

      {appointments && appointments.length === 0 && !showForm && (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="text-ink-900/60">Todavía no tienes citas agendadas.</p>
        </div>
      )}

      {appointments?.map((appt) => {
        const pet = pets.find((p) => p.petId === appt.petId);
        const professional = staff.find((s) => s.userId === appt.professionalId);
        const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
        return (
          <div key={appt.appointmentId} className="rounded-xl2 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {SERVICE_LABEL[appt.serviceType]} — {pet?.name ?? 'Mascota'}
              </h2>
              <span className="rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
                {STATUS_LABEL[appt.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-900/70">
              {new Date(appt.scheduledAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
              {professional && ` · ${professional.fullName}`}
            </p>
            {canCancel && (
              <button
                onClick={() => handleCancel(appt.appointmentId)}
                disabled={cancellingId === appt.appointmentId}
                className="mt-3 rounded-full border border-ember-200 px-3 py-1.5 text-sm text-ember-700 hover:bg-ember-50"
              >
                {cancellingId === appt.appointmentId ? 'Cancelando…' : 'Cancelar cita'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScheduleAppointmentForm({
  token,
  pets,
  staff,
  onScheduled,
}: {
  token: string;
  pets: Pet[];
  staff: StaffMember[];
  onScheduled: () => void;
}) {
  const [petId, setPetId] = useState(pets[0]?.petId ?? '');
  const [serviceType, setServiceType] = useState<ServiceType>('MEDICAL_CONSULT');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eligibleStaff = staff.filter((s) => (serviceType === 'GROOMING' ? s.role === 'GROOMER' : s.role === 'VETERINARIAN'));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!petId || !professionalId || !date || !time) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: ScheduleAppointmentPayload = {
        petId,
        professionalId,
        serviceType,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        notes: notes || undefined,
      };
      await api.post<Appointment>('/appointments', payload, token);
      onScheduled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos agendar la cita. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card">
      <p className="text-xs text-ink-900/50">Horario de atención: 7:00–12:00 y 14:00–18:00, lunes a sábado.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="apptPet" className="mb-1 block text-sm font-medium text-ink-900/80">
            Mascota
          </label>
          <select id="apptPet" value={petId} onChange={(e) => setPetId(e.target.value)} className="input">
            {pets.map((pet) => (
              <option key={pet.petId} value={pet.petId}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="apptService" className="mb-1 block text-sm font-medium text-ink-900/80">
            Servicio
          </label>
          <select
            id="apptService"
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
          <label htmlFor="apptProfessional" className="mb-1 block text-sm font-medium text-ink-900/80">
            Profesional
          </label>
          <select
            id="apptProfessional"
            required
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="apptDate" className="mb-1 block text-sm font-medium text-ink-900/80">
              Fecha
            </label>
            <input id="apptDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="apptTime" className="mb-1 block text-sm font-medium text-ink-900/80">
              Hora
            </label>
            <input id="apptTime" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="apptNotes" className="mb-1 block text-sm font-medium text-ink-900/80">
          Notas (opcional)
        </label>
        <input id="apptNotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="input" maxLength={300} />
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Agendando…' : 'Agendar cita'}
      </button>
    </form>
  );
}
