import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { ServiceType } from '../../domain/value-objects/service-type.enum';
import { AppointmentStatus } from '../../domain/value-objects/appointment-status.enum';

@Entity({ name: 'appointments', schema: 'scheduling' })
export class AppointmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId: string;

  @Column({ name: 'service_type', type: 'varchar', length: 20 })
  serviceType: ServiceType;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: 'varchar', nullable: true, length: 300 })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
