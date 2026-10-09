export enum ServiceType {
  MEDICAL_CONSULT = 'MEDICAL_CONSULT',
  VACCINATION = 'VACCINATION',
  GROOMING = 'GROOMING',
  SURGERY = 'SURGERY',
  EMERGENCY = 'EMERGENCY',
}

/** Which staff role may be assigned to each service type — AGGR-INV-APPT-004. */
export const REQUIRED_ROLE_FOR_SERVICE: Record<ServiceType, 'VETERINARIAN' | 'GROOMER'> = {
  [ServiceType.MEDICAL_CONSULT]: 'VETERINARIAN',
  [ServiceType.VACCINATION]: 'VETERINARIAN',
  [ServiceType.SURGERY]: 'VETERINARIAN',
  [ServiceType.EMERGENCY]: 'VETERINARIAN',
  [ServiceType.GROOMING]: 'GROOMER',
};

export const DEFAULT_DURATION_MINUTES: Record<ServiceType, number> = {
  [ServiceType.MEDICAL_CONSULT]: 30,
  [ServiceType.VACCINATION]: 15,
  [ServiceType.SURGERY]: 120,
  [ServiceType.EMERGENCY]: 45,
  [ServiceType.GROOMING]: 60,
};
