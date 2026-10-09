/**
 * Role names staff members log in with — kept as Clinical's own plain-string vocabulary
 * (not an import of Identity's UserRole enum) per the bounded-context rule that a domain
 * never depends on another context's types, only on values crossing at the port boundary.
 */
export const STAFF_ROLES = ['VETERINARIAN', 'GROOMER', 'RECEPTIONIST', 'ADMIN'];
