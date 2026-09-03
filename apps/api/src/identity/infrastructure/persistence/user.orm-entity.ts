import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Entity({ name: 'users', schema: 'identity' })
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  phone: string | null;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.CUSTOMER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
