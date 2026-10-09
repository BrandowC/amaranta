import { User } from '../../entities/user.entity';
import { UserRole } from '../../value-objects/user-role.enum';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByRoles(roles: UserRole[]): Promise<User[]>;
}
