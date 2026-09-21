import { randomUUID } from 'crypto';
import { DomainException } from '../../../shared/domain/domain-exception';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { ServiceType, REQUIRED_ROLE_FOR_SERVICE } from '../value-objects/service-type.enum';
import { AppointmentStatus } from '../value-objects/appointment-status.enum';
import { BusinessHours } from '../value-objects/business-hours.vo';
import { AppointmentScheduledEvent } from '../events/appointment-scheduled.event';
import { AppointmentCancelledEvent } from '../events/appointment-cancelled.event';
import { AppointmentCompletedEvent } from '../events/appointment-completed.event';

export interface AppointmentProps {
  id: string;
  petId: string;
  ownerId: string;
  professionalId: string;
  professionalRole: 'VETERINARIAN' | 'GROOMER';
  serviceType: ServiceType;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  createdBy: string;
  notes?: string;
}

/**
 * Aggregate Root — Scheduling bounded context.
 * Business-hours and no-double-booking are enforced here (create()), not only by the caller —
 * see AGGR-INV-APPT-001..004 in 02-domain/entities-and-rules.md.
 */
export class Appointment {
  private readonly events: DomainEvent[] = [];

  private constructor(private props: AppointmentProps) {}

  static schedule(input: {
    petId: string;
    ownerId: string;
    professionalId: string;
    professionalRole: 'VETERINARIAN' | 'GROOMER';
    serviceType: ServiceType;
    scheduledAt: Date;
    durationMinutes: number;
    createdBy: string;
    notes?: string;
  }): Appointment {
    // AGGR-INV-APPT-003: no past bookings.
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new DomainException('INV-APPT-003', 'scheduledAt must be in the future');
    }

    // AGGR-INV-APPT-001: business hours.
    if (!BusinessHours.isWithinBusinessHours(input.scheduledAt, input.durationMinutes)) {
      throw new DomainException(
        'INV-APPT-001',
        'appointment must be between 07:00-12:00 or 14:00-18:00, Monday to Saturday',
      );
    }

    // AGGR-INV-APPT-004: role-service compatibility.
    const requiredRole = REQUIRED_ROLE_FOR_SERVICE[input.serviceType];
    if (input.professionalRole !== requiredRole) {
      throw new DomainException(
        'INV-APPT-004',
        `service type ${input.serviceType} requires a ${requiredRole}, got ${input.professionalRole}`,
      );
    }

    if (input.notes && input.notes.length > 300) {
      throw new DomainException('INV-APPT-005', 'notes must be at most 300 characters');
    }

    const appointment = new Appointment({
      id: randomUUID(),
      petId: input.petId,
      ownerId: input.ownerId,
      professionalId: input.professionalId,
      professionalRole: input.professionalRole,
      serviceType: input.serviceType,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      status: AppointmentStatus.PENDING,
      createdBy: input.createdBy,
      notes: input.notes,
    });

    appointment.events.push(
      new AppointmentScheduledEvent(appointment.id, {
        petId: appointment.petId,
        ownerId: appointment.ownerId,
        professionalId: appointment.professionalId,
        serviceType: appointment.serviceType,
        scheduledAt: appointment.scheduledAt.toISOString(),
        durationMinutes: appointment.durationMinutes,
      }),
    );

    return appointment;
  }

  static reconstitute(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  get id(): string {
    return this.props.id;
  }

  get petId(): string {
    return this.props.petId;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get serviceType(): ServiceType {
    return this.props.serviceType;
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get endsAt(): Date {
    return new Date(this.props.scheduledAt.getTime() + this.props.durationMinutes * 60_000);
  }

  cancel(cancelledBy: string): void {
    if (this.props.status === AppointmentStatus.CANCELLED || this.props.status === AppointmentStatus.COMPLETED) {
      throw new DomainException('INV-APPT-006', `cannot cancel an appointment that is ${this.props.status}`);
    }
    this.props.status = AppointmentStatus.CANCELLED;
    this.events.push(new AppointmentCancelledEvent(this.id, { ownerId: this.ownerId, cancelledBy }));
  }

  complete(): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED && this.props.status !== AppointmentStatus.PENDING) {
      throw new DomainException('INV-APPT-007', 'only a PENDING or CONFIRMED appointment can be completed');
    }
    this.props.status = AppointmentStatus.COMPLETED;
    this.events.push(
      new AppointmentCompletedEvent(this.id, { petId: this.petId, veterinarianId: this.professionalId }),
    );
  }

  get domainEvents(): readonly DomainEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}
