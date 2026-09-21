import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentRepositoryPort } from '../../domain/ports/out/appointment-repository.port';
import { AppointmentStatus } from '../../domain/value-objects/appointment-status.enum';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { AppointmentMapper } from './appointment.mapper';

@Injectable()
export class AppointmentRepository implements AppointmentRepositoryPort {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repo: Repository<AppointmentOrmEntity>,
  ) {}

  async save(appointment: Appointment): Promise<void> {
    await this.repo.save(AppointmentMapper.toPersistence(appointment));
  }

  async findById(id: string): Promise<Appointment | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? AppointmentMapper.toDomain(row) : null;
  }

  async findByOwner(ownerId: string): Promise<Appointment[]> {
    const rows = await this.repo.find({ where: { ownerId } });
    return rows.map(AppointmentMapper.toDomain);
  }

  async findByProfessional(professionalId: string): Promise<Appointment[]> {
    const rows = await this.repo.find({ where: { professionalId } });
    return rows.map(AppointmentMapper.toDomain);
  }

  async findOverlapping(professionalId: string, scheduledAt: Date, durationMinutes: number): Promise<Appointment[]> {
    const newStart = scheduledAt;
    const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60_000);

    const rows = await this.repo
      .createQueryBuilder('a')
      .where('a.professional_id = :professionalId', { professionalId })
      .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .andWhere("a.scheduled_at < :newEnd", { newEnd })
      .andWhere("(a.scheduled_at + (a.duration_minutes * interval '1 minute')) > :newStart", { newStart })
      .getMany();

    return rows.map(AppointmentMapper.toDomain);
  }
}
