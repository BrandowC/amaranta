import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CheckoutRequestDto } from './checkout-request.dto';

export class InStoreCheckoutRequestDto extends CheckoutRequestDto {
  @ApiProperty({ description: 'The customer this in-store order is placed for' })
  @IsUUID()
  customerId: string;
}
