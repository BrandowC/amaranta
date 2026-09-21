export interface CompleteAppointmentCommand {
  appointmentId: string;
  completedBy: string;
}

export interface CompleteAppointmentUseCasePort {
  execute(command: CompleteAppointmentCommand): Promise<void>;
}
