import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FulfillmentMethod } from '../../../domain/value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../../../domain/value-objects/payment-method.enum';

export class CheckoutItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutRequestDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ enum: FulfillmentMethod, example: FulfillmentMethod.PICKUP })
  @IsEnum(FulfillmentMethod)
  fulfillmentMethod: FulfillmentMethod;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiPropertyOptional({ example: 'Calle 10 # 5-20, Neiva' })
  @ValidateIf((dto: CheckoutRequestDto) => dto.fulfillmentMethod === FulfillmentMethod.DELIVERY)
  @IsString()
  @IsNotEmpty({ message: 'deliveryAddress is required when fulfillmentMethod is DELIVERY' })
  deliveryAddress?: string;
}
