import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '3001234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
