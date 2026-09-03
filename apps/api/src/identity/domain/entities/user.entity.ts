import { randomUUID } from 'crypto';
import { DomainException } from '../../../shared/domain/domain-exception';
import { Email } from '../../../shared/domain/value-objects/email.vo';
import { UserRole } from '../value-objects/user-role.enum';

export interface UserProps {
  id: string;
  fullName: string;
  email: Email;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root — Identity & Access bounded context.
 * INV-USER-001 (unique email) is enforced at the repository/DB layer, not here,
 * because uniqueness is a set-wide invariant a single instance cannot verify.
 */
export class User {
  private constructor(private props: UserProps) {}

  static register(input: { fullName: string; email: string; passwordHash: string; phone?: string }): User {
    if (input.fullName.trim().length < 2 || input.fullName.trim().length > 100) {
      throw new DomainException('INV-USER-003', 'fullName must be between 2 and 100 characters');
    }
    const now = new Date();
    return new User({
      id: randomUUID(),
      fullName: input.fullName.trim(),
      email: Email.create(input.email),
      phone: input.phone,
      passwordHash: input.passwordHash,
      // INV-USER-002: self-registration is always CUSTOMER — never accepted as input here.
      role: UserRole.CUSTOMER,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
