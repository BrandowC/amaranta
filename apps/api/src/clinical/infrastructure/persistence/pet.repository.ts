import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../../domain/entities/pet.entity';
import { PetRepositoryPort } from '../../domain/ports/out/pet-repository.port';
import { PetOrmEntity } from './pet.orm-entity';
import { PetMapper } from './pet.mapper';

@Injectable()
export class PetRepository implements PetRepositoryPort {
  constructor(
    @InjectRepository(PetOrmEntity)
    private readonly repo: Repository<PetOrmEntity>,
  ) {}

  async save(pet: Pet): Promise<void> {
    await this.repo.save(PetMapper.toPersistence(pet));
  }

  async findById(id: string): Promise<Pet | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? PetMapper.toDomain(row) : null;
  }

  async findByOwner(ownerId: string): Promise<Pet[]> {
    const rows = await this.repo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
    return rows.map(PetMapper.toDomain);
  }
}
