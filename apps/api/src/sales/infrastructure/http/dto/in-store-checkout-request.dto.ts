import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CheckoutRequestDto } from './checkout-request.dto';

export class InStoreCheckoutRequestDto extends CheckoutRequestDto {
  @ApiPropertyOptional({
    description: 'The customer this in-store order is placed for; omit for an anonymous walk-in sale',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
