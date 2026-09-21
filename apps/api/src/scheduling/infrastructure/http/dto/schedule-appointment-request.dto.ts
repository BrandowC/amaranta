import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { ServiceType } from '../../../domain/value-objects/service-type.enum';

export class ScheduleAppointmentRequestDto {
  @ApiProperty()
  @IsUUID()
  petId: string;

  @ApiProperty()
  @IsUUID()
  professionalId: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.VACCINATION })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ example: '2026-09-20T09:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Defaults to the service type\'s standard duration', minimum: 15, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  notes?: string;
}
