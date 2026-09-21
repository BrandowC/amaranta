import { Inject, Injectable } from '@nestjs/common';
import { Pet } from '../domain/entities/pet.entity';
import { RegisterPetCommand, RegisterPetUseCasePort } from '../domain/ports/in/register-pet.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import { toPetResult } from './pet.presenter';

@Injectable()
export class RegisterPetUseCase implements RegisterPetUseCasePort {
  constructor(@Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort) {}

  async execute(command: RegisterPetCommand) {
    const pet = Pet.register({
      ownerId: command.ownerId,
      name: command.name,
      species: command.species,
      breed: command.breed,
      birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
      weightKg: command.weightKg,
      photoUrl: command.photoUrl,
    });

    await this.petRepository.save(pet);

    return toPetResult(pet);
  }
}
