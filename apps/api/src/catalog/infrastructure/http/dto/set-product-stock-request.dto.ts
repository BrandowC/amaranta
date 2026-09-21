import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SetProductStockRequestDto {
  @ApiProperty({ example: 35 })
  @IsInt()
  @Min(0)
  stockQuantity: number;
}
