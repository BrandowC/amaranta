import { Species } from '../../value-objects/species.enum';

export interface RegisterPetCommand {
  ownerId: string;
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
  photoUrl?: string;
}

export interface PetResult {
  petId: string;
  ownerId: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
  photoUrl?: string;
}

export interface RegisterPetUseCasePort {
  execute(command: RegisterPetCommand): Promise<PetResult>;
}
