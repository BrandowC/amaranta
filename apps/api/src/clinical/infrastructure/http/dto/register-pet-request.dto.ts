import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';
import { Species } from '../../../domain/value-objects/species.enum';

export class RegisterPetRequestDto {
  @ApiProperty({ example: 'Firulais' })
  @IsString()
  @Length(1, 50)
  name: string;

  @ApiProperty({ enum: Species, example: Species.DOG })
  @IsEnum(Species)
  species: Species;

  @ApiPropertyOptional({ example: 'Labrador' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  breed?: string;

  @ApiPropertyOptional({ example: '2022-05-10' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
