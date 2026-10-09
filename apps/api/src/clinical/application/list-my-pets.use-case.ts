import { Inject, Injectable } from '@nestjs/common';
import { ListMyPetsQuery, ListMyPetsUseCasePort } from '../domain/ports/in/list-my-pets.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import { toPetResult } from './pet.presenter';

@Injectable()
export class ListMyPetsUseCase implements ListMyPetsUseCasePort {
  constructor(@Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort) {}

  async execute(query: ListMyPetsQuery) {
    const pets = await this.petRepository.findByOwner(query.ownerId);
    return pets.map(toPetResult);
  }
}
