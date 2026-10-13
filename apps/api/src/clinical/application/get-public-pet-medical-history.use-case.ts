import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GetPublicPetMedicalHistoryQuery,
  GetPublicPetMedicalHistoryUseCasePort,
} from '../domain/ports/in/get-public-pet-medical-history.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import {
  MEDICAL_RECORD_REPOSITORY_PORT,
  MedicalRecordRepositoryPort,
} from '../domain/ports/out/medical-record-repository.port';
import { toMedicalRecordResult } from './medical-record.presenter';

@Injectable()
export class GetPublicPetMedicalHistoryUseCase implements GetPublicPetMedicalHistoryUseCasePort {
  constructor(
    @Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort,
    @Inject(MEDICAL_RECORD_REPOSITORY_PORT) private readonly recordRepository: MedicalRecordRepositoryPort,
  ) {}

  async execute(query: GetPublicPetMedicalHistoryQuery) {
    const pet = await this.petRepository.findById(query.petId);
    if (!pet) {
      throw new NotFoundException(`Pet ${query.petId} does not exist`);
    }

    const records = await this.recordRepository.findByPet(query.petId);

    return {
      pet: { petId: pet.id, name: pet.name, species: pet.species, breed: pet.breed },
      records: records
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(toMedicalRecordResult),
    };
  }
}
