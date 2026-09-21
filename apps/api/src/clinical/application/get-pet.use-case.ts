import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { GetPetQuery, GetPetUseCasePort } from '../domain/ports/in/get-pet.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import { STAFF_ROLES } from '../domain/value-objects/staff-roles';
import { toPetResult } from './pet.presenter';

@Injectable()
export class GetPetUseCase implements GetPetUseCasePort {
  constructor(@Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort) {}

  async execute(query: GetPetQuery) {
    const pet = await this.petRepository.findById(query.petId);
    if (!pet) {
      throw new DomainException('PET_NOT_FOUND', `Pet ${query.petId} does not exist`);
    }
    if (!pet.isOwnedBy(query.requestedBy) && !STAFF_ROLES.includes(query.requesterRole)) {
      throw new DomainException('FORBIDDEN', 'you can only view your own pets');
    }

    return toPetResult(pet);
  }
}
