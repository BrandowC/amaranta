import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { GetAvailableSlotsUseCasePort } from '../../domain/ports/in/get-available-slots.port';
import { ScheduleAppointmentUseCase } from '../../application/schedule-appointment.use-case';
import { CancelAppointmentUseCase } from '../../application/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from '../../application/complete-appointment.use-case';
import { ListMyAppointmentsUseCase } from '../../application/list-my-appointments.use-case';
import { ListAssignedAppointmentsUseCase } from '../../application/list-assigned-appointments.use-case';
import { GetAvailableSlotsUseCase } from '../../application/get-available-slots.use-case';

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
    @Inject(GetAvailableSlotsUseCase) private readonly getAvailableSlots: GetAvailableSlotsUseCasePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  schedule(@Body() body: ScheduleAppointmentRequestDto, @CurrentUser() user: AuthenticatedUser) {
    // Only a receptionist may book on someone else's behalf — everyone else always books for
    // themselves, regardless of what the request body says.
    const ownerId = user.role === UserRole.RECEPTIONIST && body.ownerId ? body.ownerId : user.userId;
    return this.scheduleAppointment.execute({ ...body, ownerId, createdBy: user.userId });
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyAppointments.execute({ ownerId: user.userId });
  }

  @Get('slots')
  slots(@Query('professionalId') professionalId: string, @Query('date') date: string) {
    return this.getAvailableSlots.execute({ professionalId, date });
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
