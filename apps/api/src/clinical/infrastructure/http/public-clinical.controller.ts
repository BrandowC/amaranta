import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPublicPetMedicalHistoryUseCasePort } from '../../domain/ports/in/get-public-pet-medical-history.port';
import { GetPublicPetMedicalHistoryUseCase } from '../../application/get-public-pet-medical-history.use-case';

/**
 * Deliberately public — no JwtAuthGuard, no RolesGuard. This is the QR/share-link endpoint for
 * a pet's medical history: kept as its own controller (rather than an unguarded method inside
 * ClinicalController) so "this route has no auth" is visible at a glance, not hidden among
 * guarded ones.
 */
@ApiTags('clinical-public')
@Controller('public/pets')
export class PublicClinicalController {
  constructor(
    @Inject(GetPublicPetMedicalHistoryUseCase) private readonly getHistory: GetPublicPetMedicalHistoryUseCasePort,
  ) {}

  @Get(':petId/medical-history')
  history(@Param('petId') petId: string) {
    return this.getHistory.execute({ petId });
  }
}
