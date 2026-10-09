import { Inject, Injectable } from '@nestjs/common';
import { SchedulingPetVerificationPort, PetOwnership } from '../../domain/ports/out/pet-verification.port';
import { PET_VERIFICATION_PORT, PetVerificationPort } from '../../../clinical/domain/ports/out/pet-verification.port';

/**
 * Implements what Scheduling needs from Clinical (does this pet exist, who owns it), by
 * delegating to Clinical's own PetVerificationPort implementation, in-process.
 */
@Injectable()
export class SchedulingPetVerificationAdapter implements SchedulingPetVerificationPort {
  constructor(@Inject(PET_VERIFICATION_PORT) private readonly clinicalPetVerification: PetVerificationPort) {}

  async getPetOwnership(petId: string): Promise<PetOwnership | null> {
    const pet = await this.clinicalPetVerification.getPet(petId);
    if (!pet) return null;
    return { petId: pet.petId, ownerId: pet.ownerId };
  }
}
