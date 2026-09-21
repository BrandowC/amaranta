import { PetResult } from './register-pet.port';

export interface ListMyPetsQuery {
  ownerId: string;
}

export interface ListMyPetsUseCasePort {
  execute(query: ListMyPetsQuery): Promise<PetResult[]>;
}
