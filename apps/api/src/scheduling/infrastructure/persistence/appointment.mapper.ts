import { Appointment } from '../../domain/entities/appointment.entity';
import { REQUIRED_ROLE_FOR_SERVICE } from '../../domain/value-objects/service-type.enum';
import { AppointmentOrmEntity } from './appointment.orm-entity';

export class AppointmentMapper {
  static toDomain(row: AppointmentOrmEntity): Appointment {
    return Appointment.reconstitute({
      id: row.id,
      petId: row.petId,
      ownerId: row.ownerId,
      professionalId: row.professionalId,
      professionalRole: REQUIRED_ROLE_FOR_SERVICE[row.serviceType],
      serviceType: row.serviceType,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      createdBy: row.createdBy,
      notes: row.notes ?? undefined,
    });
  }

  static toPersistence(appointment: Appointment): AppointmentOrmEntity {
    const row = new AppointmentOrmEntity();
    row.id = appointment.id;
    row.petId = appointment.petId;
    row.ownerId = appointment.ownerId;
    row.professionalId = appointment.professionalId;
    row.serviceType = appointment.serviceType;
    row.scheduledAt = appointment.scheduledAt;
    row.durationMinutes = appointment.durationMinutes;
    row.status = appointment.status;
    row.createdBy = appointment.createdBy;
    row.notes = appointment.notes ?? null;
    return row;
  }
}
