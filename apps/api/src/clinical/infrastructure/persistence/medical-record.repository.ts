import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import { MedicalRecordRepositoryPort } from '../../domain/ports/out/medical-record-repository.port';
import { MedicalRecordOrmEntity } from './medical-record.orm-entity';
import { MedicalRecordMapper } from './medical-record.mapper';

@Injectable()
export class MedicalRecordRepository implements MedicalRecordRepositoryPort {
  constructor(
    @InjectRepository(MedicalRecordOrmEntity)
    private readonly repo: Repository<MedicalRecordOrmEntity>,
  ) {}

  async save(record: MedicalRecord): Promise<void> {
    await this.repo.save(MedicalRecordMapper.toPersistence(record));
  }

  async findByPet(petId: string): Promise<MedicalRecord[]> {
    const rows = await this.repo.find({ where: { petId } });
    return rows.map(MedicalRecordMapper.toDomain);
  }

  async findByAppointment(appointmentId: string): Promise<MedicalRecord[]> {
    const rows = await this.repo.find({ where: { appointmentId } });
    return rows.map(MedicalRecordMapper.toDomain);
  }
}
