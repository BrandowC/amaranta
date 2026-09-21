export interface AddMedicalRecordCommand {
  appointmentId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
}

export interface MedicalRecordResult {
  medicalRecordId: string;
  petId: string;
  appointmentId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  createdAt: string;
}

export interface AddMedicalRecordUseCasePort {
  execute(command: AddMedicalRecordCommand): Promise<MedicalRecordResult>;
}
