import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from '../../../identity/infrastructure/security/roles.guard';
import { Roles } from '../../../identity/infrastructure/security/roles.decorator';
import { CurrentUser } from '../../../identity/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '../../../identity/infrastructure/security/jwt.strategy';
import { UserRole } from '../../../identity/domain/value-objects/user-role.enum';
import { ScheduleAppointmentRequestDto } from './dto/schedule-appointment-request.dto';
import { ScheduleAppointmentUseCasePort } from '../../domain/ports/in/schedule-appointment.port';
import { CancelAppointmentUseCasePort } from '../../domain/ports/in/cancel-appointment.port';
import { CompleteAppointmentUseCasePort } from '../../domain/ports/in/complete-appointment.port';
import { ListMyAppointmentsUseCasePort } from '../../domain/ports/in/list-my-appointments.port';
import { ListAssignedAppointmentsUseCasePort } from '../../domain/ports/in/list-assigned-appointments.port';
import { ScheduleAppointmentUseCase } from '../../application/schedule-appointment.use-case';
import { CancelAppointmentUseCase } from '../../application/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from '../../application/complete-appointment.use-case';
import { ListMyAppointmentsUseCase } from '../../application/list-my-appointments.use-case';
import { ListAssignedAppointmentsUseCase } from '../../application/list-assigned-appointments.use-case';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class SchedulingController {
  constructor(
    @Inject(ScheduleAppointmentUseCase) private readonly scheduleAppointment: ScheduleAppointmentUseCasePort,
    @Inject(CancelAppointmentUseCase) private readonly cancelAppointment: CancelAppointmentUseCasePort,
    @Inject(CompleteAppointmentUseCase) private readonly completeAppointment: CompleteAppointmentUseCasePort,
    @Inject(ListMyAppointmentsUseCase) private readonly listMyAppointments: ListMyAppointmentsUseCasePort,
    @Inject(ListAssignedAppointmentsUseCase) private readonly listAssignedAppointments: ListAssignedAppointmentsUseCasePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  schedule(@Body() body: ScheduleAppointmentRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.scheduleAppointment.execute({
      ownerId: user.userId,
      createdBy: user.userId,
      ...body,
    });
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyAppointments.execute({ ownerId: user.userId });
  }

  @Get('assigned')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VETERINARIAN, UserRole.GROOMER)
  listAssigned(@CurrentUser() user: AuthenticatedUser) {
    return this.listAssignedAppointments.execute({ professionalId: user.userId });
  }

  @Post(':appointmentId/cancel')
  cancel(@Param('appointmentId') appointmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cancelAppointment.execute({ appointmentId, cancelledBy: user.userId });
  }

  @Post(':appointmentId/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VETERINARIAN, UserRole.GROOMER)
  complete(@Param('appointmentId') appointmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.completeAppointment.execute({ appointmentId, completedBy: user.userId });
  }
}
