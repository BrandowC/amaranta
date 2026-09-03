export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
}

export interface LoginUseCasePort {
  execute(command: LoginCommand): Promise<LoginResult>;
}
