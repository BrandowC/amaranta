import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { LoginCommand, LoginResult, LoginUseCasePort } from '../domain/ports/in/login.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '../domain/ports/out/password-hasher.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '../domain/ports/out/token-issuer.port';

@Injectable()
export class LoginUseCase implements LoginUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(command.email.trim().toLowerCase());
    if (!user) {
      throw new DomainException('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    const passwordMatches = await this.passwordHasher.compare(command.password, user.passwordHash);
    if (!passwordMatches) {
      throw new DomainException('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

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
