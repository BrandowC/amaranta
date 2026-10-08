import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/infrastructure/security/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../identity/infrastructure/security/optional-jwt-auth.guard';
import { RolesGuard } from '../../../identity/infrastructure/security/roles.guard';
import { Roles } from '../../../identity/infrastructure/security/roles.decorator';
import { CurrentUser } from '../../../identity/infrastructure/security/current-user.decorator';
import { AuthenticatedUser } from '../../../identity/infrastructure/security/jwt.strategy';
import { UserRole } from '../../../identity/domain/value-objects/user-role.enum';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { InStoreCheckoutRequestDto } from './dto/in-store-checkout-request.dto';
import { CheckoutUseCasePort } from '../../domain/ports/in/checkout.port';
import { ListMyOrdersUseCasePort } from '../../domain/ports/in/list-my-orders.port';
import { MarkOrderAsPaidUseCasePort } from '../../domain/ports/in/mark-order-as-paid.port';
import { OrderChannel } from '../../domain/value-objects/order-channel.enum';
import { CheckoutUseCase } from '../../application/checkout.use-case';
import { ListMyOrdersUseCase } from '../../application/list-my-orders.use-case';
import { MarkOrderAsPaidUseCase } from '../../application/mark-order-as-paid.use-case';
import { WALK_IN_CUSTOMER_ID } from '../../domain/value-objects/walk-in-customer';

@ApiTags('sales')
@Controller('orders')
export class SalesController {
  constructor(
    @Inject(CheckoutUseCase) private readonly checkout: CheckoutUseCasePort,
    @Inject(ListMyOrdersUseCase) private readonly listMyOrders: ListMyOrdersUseCasePort,
    @Inject(MarkOrderAsPaidUseCase) private readonly markOrderAsPaid: MarkOrderAsPaidUseCasePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() body: CheckoutRequestDto, @CurrentUser() user: AuthenticatedUser | undefined) {
    // No account required to buy — an anonymous visitor's order is attributed to the same
    // walk-in customer reception uses for in-store sales; a logged-in customer's own account
    // is used as before so their order shows up in "Mis pedidos".
    const customerId = user?.userId ?? WALK_IN_CUSTOMER_ID;
    return this.checkout.execute({
      customerId,
      createdBy: customerId,
      channel: OrderChannel.ONLINE,
      items: body.items,
      fulfillmentMethod: body.fulfillmentMethod,
      paymentMethod: body.paymentMethod,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      deliveryAddress: body.deliveryAddress,
    });
  }

  @Post('in-store')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST)
  createInStore(@Body() body: InStoreCheckoutRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.checkout.execute({
      customerId: body.customerId ?? WALK_IN_CUSTOMER_ID,
      createdBy: user.userId,
      channel: OrderChannel.IN_STORE,
      items: body.items,
      fulfillmentMethod: body.fulfillmentMethod,
      paymentMethod: body.paymentMethod,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      deliveryAddress: body.deliveryAddress,
    });
  }

  @Post(':orderId/mark-paid')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST)
  markAsPaid(@Param('orderId') orderId: string) {
    return this.markOrderAsPaid.execute({ orderId });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyOrders.execute({ customerId: user.userId });
  }
}
