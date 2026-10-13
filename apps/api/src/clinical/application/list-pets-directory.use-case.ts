import { Inject, Injectable } from '@nestjs/common';
import { ListPetsDirectoryQuery, ListPetsDirectoryUseCasePort } from '../domain/ports/in/list-pets-directory.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import { toPetResult } from './pet.presenter';

const MAX_PAGE_SIZE = 50;

/**
 * Staff-only pet directory: with `ownerId`, reception looks up one customer's pets to book an
 * appointment for them; without it, a vet browses every pet registered in the clinic.
 */
@Injectable()
export class ListPetsDirectoryUseCase implements ListPetsDirectoryUseCasePort {
  constructor(@Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort) {}

  async execute(query: ListPetsDirectoryQuery) {
    if (query.ownerId) {
      const pets = await this.petRepository.findByOwner(query.ownerId);
      return pets.map(toPetResult);
    }

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize || MAX_PAGE_SIZE));
    const result = await this.petRepository.findAllPaginated(page, pageSize, query.name);
    return result.items.map(toPetResult);
  }
}
