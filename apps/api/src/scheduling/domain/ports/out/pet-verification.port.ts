/**
 * Driven port — what Scheduling needs from Clinical to verify a pet exists (and who owns it)
 * before booking an appointment for it. In-process today (see
 * clinical/infrastructure/adapters/scheduling-pet.adapter.ts); would become an HTTP call once
 * Scheduling and Clinical are separate services.
 */
export const SCHED_PET_VERIFICATION_PORT = Symbol('SCHED_PET_VERIFICATION_PORT');

export interface PetOwnership {
  petId: string;
  ownerId: string;
}

export interface SchedulingPetVerificationPort {
  getPetOwnership(petId: string): Promise<PetOwnership | null>;
}
