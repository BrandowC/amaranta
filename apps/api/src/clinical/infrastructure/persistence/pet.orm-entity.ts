import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { Species } from '../../domain/value-objects/species.enum';

@Entity({ name: 'pets', schema: 'clinical' })
export class PetOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  species: Species;

  @Column({ type: 'varchar', nullable: true, length: 60 })
  breed: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  weightKg: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
