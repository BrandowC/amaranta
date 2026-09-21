import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class AddMedicalRecordRequestDto {
  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ example: 'Otitis leve en oído derecho' })
  @IsString()
  @Length(1, 1000)
  diagnosis: string;

  @ApiPropertyOptional({ example: 'Limpieza y gotas óticas por 7 días' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  treatment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
