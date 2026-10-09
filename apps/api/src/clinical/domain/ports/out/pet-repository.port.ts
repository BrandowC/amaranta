import { Pet } from '../../entities/pet.entity';

export const PET_REPOSITORY_PORT = Symbol('PET_REPOSITORY_PORT');

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PetRepositoryPort {
  save(pet: Pet): Promise<void>;
  findById(id: string): Promise<Pet | null>;
  findByOwner(ownerId: string): Promise<Pet[]>;
  findAllPaginated(page: number, pageSize: number, name?: string): Promise<PaginatedResult<Pet>>;
}
