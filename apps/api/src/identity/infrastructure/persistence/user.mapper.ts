import { User } from '../../domain/entities/user.entity';
import { Email } from '../../../shared/domain/value-objects/email.vo';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(row: UserOrmEntity): User {
    return User.reconstitute({
      id: row.id,
      fullName: row.fullName,
      email: Email.create(row.email),
      phone: row.phone ?? undefined,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.fullName = user.fullName;
    row.email = user.email.value;
    row.phone = user.phone ?? null;
    row.passwordHash = user.passwordHash;
    row.role = user.role;
    row.createdAt = user.createdAt;
    row.updatedAt = user.updatedAt;
    return row;
  }
}
