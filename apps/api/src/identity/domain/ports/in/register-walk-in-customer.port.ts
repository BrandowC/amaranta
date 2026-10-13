export interface RegisterWalkInCustomerCommand {
  fullName: string;
  email: string;
  phone?: string;
}

export interface RegisterWalkInCustomerResult {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterWalkInCustomerUseCasePort {
  execute(command: RegisterWalkInCustomerCommand): Promise<RegisterWalkInCustomerResult>;
}
