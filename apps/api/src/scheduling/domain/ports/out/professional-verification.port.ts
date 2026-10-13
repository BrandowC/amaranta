/**
 * Driven port — what Scheduling needs from Identity to verify the assigned professional holds
 * a compatible role (AGGR-INV-APPT-004). In-process today; would become an HTTP call (or just
 * trusting the JWT role claim) once Scheduling is a separate service.
 */
export const PROFESSIONAL_VERIFICATION_PORT = Symbol('PROFESSIONAL_VERIFICATION_PORT');

export interface ProfessionalSnapshot {
  userId: string;
  role: 'VETERINARIAN' | 'GROOMER';
}

export interface ProfessionalVerificationPort {
  getProfessional(userId: string): Promise<ProfessionalSnapshot | null>;
}
