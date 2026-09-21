import { Inject, Injectable } from '@nestjs/common';
import { PetVerificationPort, PetSnapshot } from '../../domain/ports/out/pet-verification.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../../domain/ports/out/pet-repository.port';

/**
 * Implements the contract Scheduling depends on, backed by Clinical's own repository.
 * In-process today; would move behind an HTTP endpoint once Scheduling is a separate service.
 */
@Injectable()
export class PetVerificationAdapter implements PetVerificationPort {
  constructor(@Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort) {}

  async getPet(petId: string): Promise<PetSnapshot | null> {
    const pet = await this.petRepository.findById(petId);
    if (!pet) return null;
    return { petId: pet.id, ownerId: pet.ownerId, name: pet.name };
  }
}
