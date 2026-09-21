import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { MedicalRecord } from '../domain/entities/medical-record.entity';
import { AddMedicalRecordCommand, AddMedicalRecordUseCasePort } from '../domain/ports/in/add-medical-record.port';
import {
  MEDICAL_RECORD_REPOSITORY_PORT,
  MedicalRecordRepositoryPort,
} from '../domain/ports/out/medical-record-repository.port';
import { APPOINTMENT_STATUS_PORT, AppointmentStatusPort } from '../domain/ports/out/appointment-status.port';
import { toMedicalRecordResult } from './medical-record.presenter';

@Injectable()
export class AddMedicalRecordUseCase implements AddMedicalRecordUseCasePort {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY_PORT) private readonly recordRepository: MedicalRecordRepositoryPort,
    @Inject(APPOINTMENT_STATUS_PORT) private readonly appointmentStatus: AppointmentStatusPort,
  ) {}

  async execute(command: AddMedicalRecordCommand) {
    const appointment = await this.appointmentStatus.getAppointment(command.appointmentId);
    if (!appointment) {
      throw new DomainException('APPOINTMENT_NOT_FOUND', `Appointment ${command.appointmentId} does not exist`);
    }
    // INV-MEDREC-003: a medical record can only be written for a COMPLETED appointment.
    if (!appointment.isCompleted) {
      throw new DomainException('INV-MEDREC-003', 'appointment must be COMPLETED before adding a medical record');
    }
    if (appointment.veterinarianId !== command.veterinarianId) {
      throw new DomainException('FORBIDDEN', 'only the veterinarian assigned to this appointment can add its medical record');
    }

    const record = MedicalRecord.create({
      petId: appointment.petId,
      appointmentId: command.appointmentId,
      veterinarianId: command.veterinarianId,
      diagnosis: command.diagnosis,
      treatment: command.treatment,
      notes: command.notes,
    });

    await this.recordRepository.save(record);

    return toMedicalRecordResult(record);
  }
}
