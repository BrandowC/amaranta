import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerLookupResult,
  FindCustomerByEmailQuery,
  FindCustomerByEmailUseCasePort,
} from '../domain/ports/in/find-customer-by-email.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../domain/ports/out/user-repository.port';

@Injectable()
export class FindCustomerByEmailUseCase implements FindCustomerByEmailUseCasePort {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {}

  async execute(query: FindCustomerByEmailQuery): Promise<CustomerLookupResult | null> {
    const user = await this.userRepository.findByEmail(query.email.trim().toLowerCase());
    if (!user) return null;
    return { userId: user.id, fullName: user.fullName, email: user.email.value };
  }
}
