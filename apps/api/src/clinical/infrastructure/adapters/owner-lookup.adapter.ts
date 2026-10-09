import { Inject, Injectable } from '@nestjs/common';
import { OwnerLookupPort } from '../../domain/ports/out/owner-lookup.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../../../identity/domain/ports/out/user-repository.port';

/**
 * Implements what Clinical needs from Identity (an owner's display name), by delegating to
 * Identity's own user repository, in-process.
 */
@Injectable()
export class OwnerLookupAdapter implements OwnerLookupPort {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {}

  async getOwnerName(ownerId: string): Promise<string | null> {
    const user = await this.userRepository.findById(ownerId);
    return user ? user.fullName : null;
  }
}
