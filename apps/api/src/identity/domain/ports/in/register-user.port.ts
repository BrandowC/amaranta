export interface RegisterUserCommand {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterUserResult {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
}

export interface RegisterUserUseCasePort {
  execute(command: RegisterUserCommand): Promise<RegisterUserResult>;
}
