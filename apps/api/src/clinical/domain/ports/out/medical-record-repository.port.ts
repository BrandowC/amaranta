import { MedicalRecord } from '../../entities/medical-record.entity';

export const MEDICAL_RECORD_REPOSITORY_PORT = Symbol('MEDICAL_RECORD_REPOSITORY_PORT');

export interface MedicalRecordRepositoryPort {
  save(record: MedicalRecord): Promise<void>;
  findByPet(petId: string): Promise<MedicalRecord[]>;
  findByAppointment(appointmentId: string): Promise<MedicalRecord[]>;
}
