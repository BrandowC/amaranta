import { MedicalRecordResult } from './add-medical-record.port';

export interface GetPetMedicalHistoryQuery {
  petId: string;
  requestedBy: string;
  requesterRole: string;
}

export interface GetPetMedicalHistoryUseCasePort {
  execute(query: GetPetMedicalHistoryQuery): Promise<MedicalRecordResult[]>;
}
