/**
 * Driven port — what Clinical needs from Identity to show a pet owner's name in the vet's
 * medical-record form. Implemented in-process today; would become an HTTP call once Clinical
 * and Identity are separate services.
 */
export const OWNER_LOOKUP_PORT = Symbol('OWNER_LOOKUP_PORT');

export interface OwnerLookupPort {
  getOwnerName(ownerId: string): Promise<string | null>;
}
