import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { User } from '../domain/entities/user.entity';
import { RegisterUserCommand, RegisterUserResult, RegisterUserUseCasePort } from '../domain/ports/in/register-user.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '../domain/ports/out/password-hasher.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '../domain/ports/out/token-issuer.port';

@Injectable()
export class RegisterUserUseCase implements RegisterUserUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    if (command.password.length < 8) {
      throw new DomainException('INV-USER-004', 'password must be at least 8 characters');
    }

    const existing = await this.userRepository.findByEmail(command.email.trim().toLowerCase());
    if (existing) {
      throw new DomainException('EMAIL_ALREADY_REGISTERED', `A user with email "${command.email}" already exists`);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.register({
      fullName: command.fullName,
      email: command.email,
      passwordHash,
      phone: command.phone,
    });

    await this.userRepository.save(user);

    const accessToken = this.tokenIssuer.issue({ userId: user.id, role: user.role });

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email.value,
      role: user.role,
      accessToken,
    };
  }
}
