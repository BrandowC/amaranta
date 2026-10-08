import { PetResult } from './register-pet.port';

export interface ListPetsDirectoryQuery {
  /** When present, returns only this owner's pets (used by reception to book on their behalf). */
  ownerId?: string;
  /** When present, a case-insensitive partial match on the pet's name (used by the vet's search). */
  name?: string;
  page: number;
  pageSize: number;
}

export interface ListPetsDirectoryUseCasePort {
  execute(query: ListPetsDirectoryQuery): Promise<PetResult[]>;
}
