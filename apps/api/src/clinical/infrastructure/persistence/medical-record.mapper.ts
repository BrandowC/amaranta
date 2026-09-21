import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import { MedicalRecordOrmEntity } from './medical-record.orm-entity';

export class MedicalRecordMapper {
  static toDomain(row: MedicalRecordOrmEntity): MedicalRecord {
    return MedicalRecord.reconstitute({
      id: row.id,
      petId: row.petId,
      appointmentId: row.appointmentId,
      veterinarianId: row.veterinarianId,
      diagnosis: row.diagnosis,
      treatment: row.treatment ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(record: MedicalRecord): MedicalRecordOrmEntity {
    const row = new MedicalRecordOrmEntity();
    row.id = record.id;
    row.petId = record.petId;
    row.appointmentId = record.appointmentId;
    row.veterinarianId = record.veterinarianId;
    row.diagnosis = record.diagnosis;
    row.treatment = record.treatment ?? null;
    row.notes = record.notes ?? null;
    row.createdAt = record.createdAt;
    return row;
  }
}
