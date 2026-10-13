import { Inject, Injectable } from '@nestjs/common';
import { ProfessionalVerificationPort, ProfessionalSnapshot } from '../../domain/ports/out/professional-verification.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../../../identity/domain/ports/out/user-repository.port';
import { UserRole } from '../../../identity/domain/value-objects/user-role.enum';

/**
 * Implements what Scheduling needs from Identity (does the assigned professional exist, and
 * what role do they hold), by delegating to Identity's own user repository, in-process.
 */
@Injectable()
export class ProfessionalVerificationAdapter implements ProfessionalVerificationPort {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {}

  async getProfessional(userId: string): Promise<ProfessionalSnapshot | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    if (user.role !== UserRole.VETERINARIAN && user.role !== UserRole.GROOMER) return null;
    // Scheduling keeps its own vocabulary for the role (its domain port never imports Identity's
    // UserRole) — this explicit mapping is the boundary where the two vocabularies meet.
    const role = user.role === UserRole.VETERINARIAN ? 'VETERINARIAN' : 'GROOMER';
    return { userId: user.id, role };
  }
}
