import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { SchedulingController } from './infrastructure/http/scheduling.controller';
import { ScheduleAppointmentUseCase } from './application/schedule-appointment.use-case';
import { CancelAppointmentUseCase } from './application/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from './application/complete-appointment.use-case';
import { ListMyAppointmentsUseCase } from './application/list-my-appointments.use-case';
import { ListAssignedAppointmentsUseCase } from './application/list-assigned-appointments.use-case';
import { APPOINTMENT_REPOSITORY_PORT } from './domain/ports/out/appointment-repository.port';
import { SCHED_PET_VERIFICATION_PORT } from './domain/ports/out/pet-verification.port';
import { PROFESSIONAL_VERIFICATION_PORT } from './domain/ports/out/professional-verification.port';
import { AppointmentRepository } from './infrastructure/persistence/appointment.repository';
import { SchedulingPetVerificationAdapter } from './infrastructure/adapters/pet-verification.adapter';
import { ProfessionalVerificationAdapter } from './infrastructure/adapters/professional-verification.adapter';
import { AppointmentStatusAdapter } from './infrastructure/adapters/appointment-status.adapter';
import { AppointmentNotificationListener } from './infrastructure/messaging/appointment-notification.listener';
import { AppointmentOrmEntity } from './infrastructure/persistence/appointment.orm-entity';
import { APPOINTMENT_STATUS_PORT } from '../clinical/domain/ports/out/appointment-status.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentOrmEntity]),
    IdentityModule,
    // Only for SchedulingPetVerificationAdapter's dependency on Clinical's PET_VERIFICATION_PORT
    // — forwardRef because the dependency is mutual (see clinical.module.ts).
    forwardRef(() => ClinicalModule),
  ],
  controllers: [SchedulingController],
  providers: [
    ScheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    CompleteAppointmentUseCase,
    ListMyAppointmentsUseCase,
    ListAssignedAppointmentsUseCase,
    AppointmentNotificationListener,
    { provide: APPOINTMENT_REPOSITORY_PORT, useClass: AppointmentRepository },
    { provide: SCHED_PET_VERIFICATION_PORT, useClass: SchedulingPetVerificationAdapter },
    { provide: PROFESSIONAL_VERIFICATION_PORT, useClass: ProfessionalVerificationAdapter },
    { provide: APPOINTMENT_STATUS_PORT, useClass: AppointmentStatusAdapter },
  ],
  // APPOINTMENT_STATUS_PORT is exported so Clinical can check "is this appointment COMPLETED?"
  // before accepting a new medical record.
  exports: [APPOINTMENT_STATUS_PORT],
})
export class SchedulingModule {}
