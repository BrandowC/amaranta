import { randomUUID } from 'crypto';
import { DomainException } from '../../../shared/domain/domain-exception';

export interface MedicalRecordProps {
  id: string;
  petId: string;
  appointmentId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  createdAt: Date;
}

/**
 * Aggregate Root — Clinical Records bounded context.
 * INV-MEDREC-001: immutable once created — a correction is a new entry, never an edit of this
 * one, so the medical history stays an audit-safe record.
 */
export class MedicalRecord {
  private constructor(private readonly props: MedicalRecordProps) {}

  static create(input: {
    petId: string;
    appointmentId: string;
    veterinarianId: string;
    diagnosis: string;
    treatment?: string;
    notes?: string;
  }): MedicalRecord {
    const diagnosis = input.diagnosis.trim();
    if (!diagnosis) {
      throw new DomainException('INV-MEDREC-002', 'diagnosis is required');
    }
    if (diagnosis.length > 1000) {
      throw new DomainException('INV-MEDREC-002', 'diagnosis must be at most 1000 characters');
    }
    if (input.treatment && input.treatment.length > 1000) {
      throw new DomainException('INV-MEDREC-002', 'treatment must be at most 1000 characters');
    }

    return new MedicalRecord({
      id: randomUUID(),
      petId: input.petId,
      appointmentId: input.appointmentId,
      veterinarianId: input.veterinarianId,
      diagnosis,
      treatment: input.treatment,
      notes: input.notes,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: MedicalRecordProps): MedicalRecord {
    return new MedicalRecord(props);
  }

  get id(): string {
    return this.props.id;
  }

  get petId(): string {
    return this.props.petId;
  }

  get appointmentId(): string {
    return this.props.appointmentId;
  }

  get veterinarianId(): string {
    return this.props.veterinarianId;
  }

  get diagnosis(): string {
    return this.props.diagnosis;
  }

  get treatment(): string | undefined {
    return this.props.treatment;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
