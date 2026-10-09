import { UserRole } from '../../value-objects/user-role.enum';

export interface StaffMemberView {
  userId: string;
  fullName: string;
  role: UserRole;
}

export interface ListStaffUseCasePort {
  execute(): Promise<StaffMemberView[]>;
}
