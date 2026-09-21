import { randomUUID } from 'crypto';
import { DomainException } from '../../../shared/domain/domain-exception';
import { Species } from '../value-objects/species.enum';

export interface PetProps {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  breed?: string;
  birthDate?: Date;
  weightKg?: number;
  photoUrl?: string;
  createdAt: Date;
}

/**
 * Aggregate Root — Clinical Records bounded context.
 */
export class Pet {
  private constructor(private props: PetProps) {}

  static register(input: {
    ownerId: string;
    name: string;
    species: Species;
    breed?: string;
    birthDate?: Date;
    weightKg?: number;
    photoUrl?: string;
  }): Pet {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 50) {
      throw new DomainException('INV-PET-002', 'pet name must be between 1 and 50 characters');
    }

    // INV-PET-001: weight, if present, must be positive.
    if (input.weightKg !== undefined && input.weightKg <= 0) {
      throw new DomainException('INV-PET-001', 'weightKg must be greater than 0 when present');
    }

    return new Pet({
      id: randomUUID(),
      ownerId: input.ownerId,
      name,
      species: input.species,
      breed: input.breed,
      birthDate: input.birthDate,
      weightKg: input.weightKg,
      photoUrl: input.photoUrl,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PetProps): Pet {
    return new Pet(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get name(): string {
    return this.props.name;
  }

  get species(): Species {
    return this.props.species;
  }

  get breed(): string | undefined {
    return this.props.breed;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get weightKg(): number | undefined {
    return this.props.weightKg;
  }

  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }
}
