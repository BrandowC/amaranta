import { MedicalRecordResult } from './add-medical-record.port';
import { Species } from '../../value-objects/species.enum';

export interface GetPublicPetMedicalHistoryQuery {
  petId: string;
}

export interface PublicPetView {
  petId: string;
  name: string;
  species: Species;
  breed?: string;
}

export interface PublicPetMedicalHistoryResult {
  pet: PublicPetView;
  records: MedicalRecordResult[];
}

/**
 * Intentionally has no `requestedBy`/role field — this is the read model behind the QR/share
 * link on a pet's profile, meant to be opened by anyone holding the link, no login required.
 * The pet's UUID is the only "key".
 */
export interface GetPublicPetMedicalHistoryUseCasePort {
  execute(query: GetPublicPetMedicalHistoryQuery): Promise<PublicPetMedicalHistoryResult>;
}
