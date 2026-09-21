import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class RegisterWalkInCustomerRequestDto {
  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
