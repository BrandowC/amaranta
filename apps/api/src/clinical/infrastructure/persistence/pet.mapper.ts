import { Pet } from '../../domain/entities/pet.entity';
import { PetOrmEntity } from './pet.orm-entity';

export class PetMapper {
  static toDomain(row: PetOrmEntity): Pet {
    return Pet.reconstitute({
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      species: row.species,
      breed: row.breed ?? undefined,
      birthDate: row.birthDate ? new Date(row.birthDate) : undefined,
      weightKg: row.weightKg ? Number(row.weightKg) : undefined,
      photoUrl: row.photoUrl ?? undefined,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(pet: Pet): PetOrmEntity {
    const row = new PetOrmEntity();
    row.id = pet.id;
    row.ownerId = pet.ownerId;
    row.name = pet.name;
    row.species = pet.species;
    row.breed = pet.breed ?? null;
    row.birthDate = pet.birthDate ? pet.birthDate.toISOString().slice(0, 10) : null;
    row.weightKg = pet.weightKg !== undefined ? String(pet.weightKg) : null;
    row.photoUrl = pet.photoUrl ?? null;
    row.createdAt = pet.createdAt;
    return row;
  }
}
