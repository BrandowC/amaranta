import { Inject, Injectable } from '@nestjs/common';
import { ListStaffUseCasePort, StaffMemberView } from '../domain/ports/in/list-staff.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import { UserRole } from '../domain/value-objects/user-role.enum';

const STAFF_ROLES = [UserRole.VETERINARIAN, UserRole.GROOMER];

@Injectable()
export class ListStaffUseCase implements ListStaffUseCasePort {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {}

  async execute(): Promise<StaffMemberView[]> {
    const staff = await this.userRepository.findByRoles(STAFF_ROLES);
    return staff.map((user) => ({ userId: user.id, fullName: user.fullName, role: user.role }));
  }
}
