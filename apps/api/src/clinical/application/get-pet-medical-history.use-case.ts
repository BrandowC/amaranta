import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import {
  GetPetMedicalHistoryQuery,
  GetPetMedicalHistoryUseCasePort,
} from '../domain/ports/in/get-pet-medical-history.port';
import { PET_REPOSITORY_PORT, PetRepositoryPort } from '../domain/ports/out/pet-repository.port';
import {
  MEDICAL_RECORD_REPOSITORY_PORT,
  MedicalRecordRepositoryPort,
} from '../domain/ports/out/medical-record-repository.port';
import { STAFF_ROLES } from '../domain/value-objects/staff-roles';
import { toMedicalRecordResult } from './medical-record.presenter';

@Injectable()
export class GetPetMedicalHistoryUseCase implements GetPetMedicalHistoryUseCasePort {
  constructor(
    @Inject(PET_REPOSITORY_PORT) private readonly petRepository: PetRepositoryPort,
    @Inject(MEDICAL_RECORD_REPOSITORY_PORT) private readonly recordRepository: MedicalRecordRepositoryPort,
  ) {}

  async execute(query: GetPetMedicalHistoryQuery) {
    const pet = await this.petRepository.findById(query.petId);
    if (!pet) {
      throw new DomainException('PET_NOT_FOUND', `Pet ${query.petId} does not exist`);
    }
    if (!pet.isOwnedBy(query.requestedBy) && !STAFF_ROLES.includes(query.requesterRole)) {
      throw new DomainException('FORBIDDEN', 'you can only view the medical history of your own pets');
    }

    const records = await this.recordRepository.findByPet(query.petId);
    return records
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(toMedicalRecordResult);
  }
}
