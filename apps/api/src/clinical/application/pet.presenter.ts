import { Pet } from '../domain/entities/pet.entity';
import { PetResult } from '../domain/ports/in/register-pet.port';

export function toPetResult(pet: Pet): PetResult {
  return {
    petId: pet.id,
    ownerId: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    birthDate: pet.birthDate?.toISOString().slice(0, 10),
    weightKg: pet.weightKg,
    photoUrl: pet.photoUrl,
  };
}
