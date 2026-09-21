import { Pet } from '../../entities/pet.entity';

export const PET_REPOSITORY_PORT = Symbol('PET_REPOSITORY_PORT');

export interface PetRepositoryPort {
  save(pet: Pet): Promise<void>;
  findById(id: string): Promise<Pet | null>;
  findByOwner(ownerId: string): Promise<Pet[]>;
}
