export interface CancelAppointmentCommand {
  appointmentId: string;
  cancelledBy: string;
}

export interface CancelAppointmentUseCasePort {
  execute(command: CancelAppointmentCommand): Promise<void>;
}
