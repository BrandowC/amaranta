import { MedicalRecord } from '../domain/entities/medical-record.entity';
import { MedicalRecordResult } from '../domain/ports/in/add-medical-record.port';

export function toMedicalRecordResult(record: MedicalRecord): MedicalRecordResult {
  return {
    medicalRecordId: record.id,
    petId: record.petId,
    appointmentId: record.appointmentId,
    veterinarianId: record.veterinarianId,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
  };
}
