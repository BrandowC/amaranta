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
  /** Only populated by lookups that resolve it via Identity (e.g. GetPetUseCase) — not every caller needs it. */
  ownerName?: string;
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
