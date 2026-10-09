/**
 * Driven-side contract that OTHER contexts (Scheduling) use to verify a pet exists and who
 * owns it, before booking an appointment for it. Implemented by Clinical's own use case.
 */
export const PET_VERIFICATION_PORT = Symbol('PET_VERIFICATION_PORT');

export interface PetSnapshot {
  petId: string;
  ownerId: string;
  name: string;
}

export interface PetVerificationPort {
  getPet(petId: string): Promise<PetSnapshot | null>;
}
