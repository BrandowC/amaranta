import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'medical_records', schema: 'clinical' })
export class MedicalRecordOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId: string;

  @Column({ length: 1000 })
  diagnosis: string;

  @Column({ type: 'varchar', nullable: true, length: 1000 })
  treatment: string | null;

  @Column({ type: 'varchar', nullable: true, length: 1000 })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
