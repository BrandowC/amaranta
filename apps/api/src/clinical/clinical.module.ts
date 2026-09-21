import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { ClinicalController } from './infrastructure/http/clinical.controller';
import { RegisterPetUseCase } from './application/register-pet.use-case';
import { ListMyPetsUseCase } from './application/list-my-pets.use-case';
import { GetPetUseCase } from './application/get-pet.use-case';
import { AddMedicalRecordUseCase } from './application/add-medical-record.use-case';
import { GetPetMedicalHistoryUseCase } from './application/get-pet-medical-history.use-case';
import { PET_REPOSITORY_PORT } from './domain/ports/out/pet-repository.port';
import { MEDICAL_RECORD_REPOSITORY_PORT } from './domain/ports/out/medical-record-repository.port';
import { PET_VERIFICATION_PORT } from './domain/ports/out/pet-verification.port';
import { PetRepository } from './infrastructure/persistence/pet.repository';
import { MedicalRecordRepository } from './infrastructure/persistence/medical-record.repository';
import { PetVerificationAdapter } from './infrastructure/adapters/pet-verification.adapter';
import { PetOrmEntity } from './infrastructure/persistence/pet.orm-entity';
import { MedicalRecordOrmEntity } from './infrastructure/persistence/medical-record.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PetOrmEntity, MedicalRecordOrmEntity]),
    IdentityModule,
    // Only for AddMedicalRecordUseCase's APPOINTMENT_STATUS_PORT, which Scheduling provides
    // and exports (see scheduling.module.ts) — forwardRef because the dependency is mutual.
    forwardRef(() => SchedulingModule),
  ],
  controllers: [ClinicalController],
  providers: [
    RegisterPetUseCase,
    ListMyPetsUseCase,
    GetPetUseCase,
    AddMedicalRecordUseCase,
    GetPetMedicalHistoryUseCase,
    { provide: PET_REPOSITORY_PORT, useClass: PetRepository },
    { provide: MEDICAL_RECORD_REPOSITORY_PORT, useClass: MedicalRecordRepository },
    { provide: PET_VERIFICATION_PORT, useClass: PetVerificationAdapter },
  ],
  // PET_VERIFICATION_PORT is exported so Scheduling can verify a pet exists before booking.
  exports: [PET_VERIFICATION_PORT],
})
export class ClinicalModule {}
