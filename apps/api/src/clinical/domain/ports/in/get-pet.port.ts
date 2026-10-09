import { PetResult } from './register-pet.port';

export interface GetPetQuery {
  petId: string;
  requestedBy: string;
  requesterRole: string;
}

export interface GetPetUseCasePort {
  execute(query: GetPetQuery): Promise<PetResult>;
}
