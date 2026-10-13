import { Pet } from './pet.entity';
import { Species } from '../value-objects/species.enum';

describe('Pet', () => {
  it('registers successfully with only the required fields', () => {
    const pet = Pet.register({ ownerId: 'owner-1', name: 'Firulais', species: Species.DOG });
    expect(pet.ownerId).toBe('owner-1');
    expect(pet.name).toBe('Firulais');
    expect(pet.weightKg).toBeUndefined();
  });

  it('rejects a non-positive weight (INV-PET-001)', () => {
    expect(() =>
      Pet.register({ ownerId: 'owner-1', name: 'Firulais', species: Species.DOG, weightKg: -1 }),
    ).toThrow('INV-PET-001');
    expect(() =>
      Pet.register({ ownerId: 'owner-1', name: 'Firulais', species: Species.DOG, weightKg: 0 }),
    ).toThrow('INV-PET-001');
  });

  it('accepts a positive weight', () => {
    const pet = Pet.register({ ownerId: 'owner-1', name: 'Firulais', species: Species.DOG, weightKg: 12.5 });
    expect(pet.weightKg).toBe(12.5);
  });

  it('rejects an empty name', () => {
    expect(() => Pet.register({ ownerId: 'owner-1', name: '  ', species: Species.CAT })).toThrow('INV-PET-002');
  });

  it('isOwnedBy() checks the owner id', () => {
    const pet = Pet.register({ ownerId: 'owner-1', name: 'Firulais', species: Species.DOG });
    expect(pet.isOwnedBy('owner-1')).toBe(true);
    expect(pet.isOwnedBy('someone-else')).toBe(false);
  });
});
