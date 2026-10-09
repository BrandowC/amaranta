import { Appointment } from './appointment.entity';
import { ServiceType } from '../value-objects/service-type.enum';
import { AppointmentStatus } from '../value-objects/appointment-status.enum';

function nextMonday9am(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // next Monday
  d.setHours(9, 0, 0, 0);
  return d;
}

function scheduleParams(overrides: Partial<Parameters<typeof Appointment.schedule>[0]> = {}) {
  return {
    petId: 'pet-1',
    ownerId: 'owner-1',
    professionalId: 'vet-1',
    professionalRole: 'VETERINARIAN' as const,
    serviceType: ServiceType.VACCINATION,
    scheduledAt: nextMonday9am(),
    durationMinutes: 15,
    createdBy: 'owner-1',
    ...overrides,
  };
}

describe('Appointment', () => {
  it('schedules successfully within business hours and emits AppointmentScheduled', () => {
    const appointment = Appointment.schedule(scheduleParams());
    expect(appointment.status).toBe(AppointmentStatus.PENDING);
    expect(appointment.domainEvents).toHaveLength(1);
    expect(appointment.domainEvents[0].eventType).toBe('AppointmentScheduled');
  });

  it('rejects a booking in the past (INV-APPT-003)', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(() => Appointment.schedule(scheduleParams({ scheduledAt: yesterday }))).toThrow('INV-APPT-003');
  });

  it('rejects a booking outside business hours (INV-APPT-001)', () => {
    const lunchtime = nextMonday9am();
    lunchtime.setHours(13, 0, 0, 0); // 13:00 is the lunch break
    expect(() => Appointment.schedule(scheduleParams({ scheduledAt: lunchtime }))).toThrow('INV-APPT-001');
  });

  it('rejects a booking that straddles closing time (INV-APPT-001)', () => {
    const closeToClosing = nextMonday9am();
    closeToClosing.setHours(17, 45, 0, 0);
    expect(() =>
      Appointment.schedule(scheduleParams({ scheduledAt: closeToClosing, durationMinutes: 30 })),
    ).toThrow('INV-APPT-001');
  });

  it('rejects a role incompatible with the service type (INV-APPT-004)', () => {
    expect(() =>
      Appointment.schedule(scheduleParams({ serviceType: ServiceType.SURGERY, professionalRole: 'GROOMER' })),
    ).toThrow('INV-APPT-004');
  });

  it('cancel() moves PENDING to CANCELLED and emits AppointmentCancelled', () => {
    const appointment = Appointment.schedule(scheduleParams());
    appointment.clearEvents();
    appointment.cancel('owner-1');
    expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointment.domainEvents[0].eventType).toBe('AppointmentCancelled');
  });

  it('cannot cancel an already-completed appointment (INV-APPT-006)', () => {
    const appointment = Appointment.schedule(scheduleParams());
    appointment.complete();
    expect(() => appointment.cancel('owner-1')).toThrow('INV-APPT-006');
  });

  it('complete() moves PENDING to COMPLETED and emits AppointmentCompleted', () => {
    const appointment = Appointment.schedule(scheduleParams());
    appointment.clearEvents();
    appointment.complete();
    expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
    expect(appointment.domainEvents[0].eventType).toBe('AppointmentCompleted');
  });
});
