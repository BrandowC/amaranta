import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { User } from '../domain/entities/user.entity';
import {
  RegisterWalkInCustomerCommand,
  RegisterWalkInCustomerResult,
  RegisterWalkInCustomerUseCasePort,
} from '../domain/ports/in/register-walk-in-customer.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '../domain/ports/out/password-hasher.port';

/**
 * A receptionist registers a customer who is physically present but won't be
 * given online-login credentials — the account exists so their pets/orders/
 * appointments can be tracked. The random password makes the stored hash
 * unusable for login without adding a nullable-password special case to the
 * User aggregate.
 */
@Injectable()
export class RegisterWalkInCustomerUseCase implements RegisterWalkInCustomerUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(command: RegisterWalkInCustomerCommand): Promise<RegisterWalkInCustomerResult> {
    const existing = await this.userRepository.findByEmail(command.email.trim().toLowerCase());
    if (existing) {
      throw new DomainException('EMAIL_ALREADY_REGISTERED', `A user with email "${command.email}" already exists`);
    }

    const passwordHash = await this.passwordHasher.hash(randomUUID());
    const user = User.register({
      fullName: command.fullName,
      email: command.email,
      passwordHash,
      phone: command.phone,
    });

    await this.userRepository.save(user);

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email.value,
      role: user.role,
    };
  }
}
