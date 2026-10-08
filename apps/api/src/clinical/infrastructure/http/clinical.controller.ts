import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from '../../../identity/infrastructure/security/roles.guard';
import { Roles } from '../../../identity/infrastructure/security/roles.decorator';
import { CurrentUser } from '../../../identity/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '../../../identity/infrastructure/security/jwt.strategy';
import { UserRole } from '../../../identity/domain/value-objects/user-role.enum';
import { RegisterPetRequestDto } from './dto/register-pet-request.dto';
import { AddMedicalRecordRequestDto } from './dto/add-medical-record-request.dto';
import { RegisterPetUseCasePort } from '../../domain/ports/in/register-pet.port';
import { ListMyPetsUseCasePort } from '../../domain/ports/in/list-my-pets.port';
import { GetPetUseCasePort } from '../../domain/ports/in/get-pet.port';
import { ListPetsDirectoryUseCasePort } from '../../domain/ports/in/list-pets-directory.port';
import { AddMedicalRecordUseCasePort } from '../../domain/ports/in/add-medical-record.port';
import { GetPetMedicalHistoryUseCasePort } from '../../domain/ports/in/get-pet-medical-history.port';
import { RegisterPetUseCase } from '../../application/register-pet.use-case';
import { ListMyPetsUseCase } from '../../application/list-my-pets.use-case';
import { GetPetUseCase } from '../../application/get-pet.use-case';
import { ListPetsDirectoryUseCase } from '../../application/list-pets-directory.use-case';
import { AddMedicalRecordUseCase } from '../../application/add-medical-record.use-case';
import { GetPetMedicalHistoryUseCase } from '../../application/get-pet-medical-history.use-case';

@ApiTags('clinical')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ClinicalController {
  constructor(
    @Inject(RegisterPetUseCase) private readonly registerPet: RegisterPetUseCasePort,
    @Inject(ListMyPetsUseCase) private readonly listMyPets: ListMyPetsUseCasePort,
    @Inject(GetPetUseCase) private readonly getPet: GetPetUseCasePort,
    @Inject(ListPetsDirectoryUseCase) private readonly listPetsDirectory: ListPetsDirectoryUseCasePort,
    @Inject(AddMedicalRecordUseCase) private readonly addMedicalRecord: AddMedicalRecordUseCasePort,
    @Inject(GetPetMedicalHistoryUseCase) private readonly getPetHistory: GetPetMedicalHistoryUseCasePort,
  ) {}

  @Post('pets')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.VETERINARIAN)
  register(@Body() body: RegisterPetRequestDto) {
    // Only a vet registers pets, always on behalf of the customer named in the body.
    return this.registerPet.execute(body);
  }

  @Get('pets')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyPets.execute({ ownerId: user.userId });
  }

  @Get('pets/directory')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VETERINARIAN, UserRole.RECEPTIONIST, UserRole.ADMIN)
  directory(
    @Query('ownerId') ownerId?: string,
    @Query('name') name?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listPetsDirectory.execute({
      ownerId,
      name,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get('pets/:petId')
  get(@Param('petId') petId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getPet.execute({ petId, requestedBy: user.userId, requesterRole: user.role });
  }

  @Get('pets/:petId/medical-history')
  history(@Param('petId') petId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getPetHistory.execute({ petId, requestedBy: user.userId, requesterRole: user.role });
  }

  @Post('medical-records')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.VETERINARIAN)
  addRecord(@Body() body: AddMedicalRecordRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.addMedicalRecord.execute({ veterinarianId: user.userId, ...body });
  }
}
