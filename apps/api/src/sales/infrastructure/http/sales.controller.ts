import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../identity/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '../../../identity/infrastructure/security/jwt.strategy';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutUseCasePort } from '../../domain/ports/in/checkout.port';
import { ListMyOrdersUseCasePort } from '../../domain/ports/in/list-my-orders.port';
import { OrderChannel } from '../../domain/value-objects/order-channel.enum';
import { CheckoutUseCase } from '../../application/checkout.use-case';
import { ListMyOrdersUseCase } from '../../application/list-my-orders.use-case';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class SalesController {
  constructor(
    @Inject(CheckoutUseCase) private readonly checkout: CheckoutUseCasePort,
    @Inject(ListMyOrdersUseCase) private readonly listMyOrders: ListMyOrdersUseCasePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CheckoutRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.checkout.execute({
      customerId: user.userId,
      createdBy: user.userId,
      channel: OrderChannel.ONLINE,
      items: body.items,
      fulfillmentMethod: body.fulfillmentMethod,
      paymentMethod: body.paymentMethod,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      deliveryAddress: body.deliveryAddress,
    });
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyOrders.execute({ customerId: user.userId });
  }
}
