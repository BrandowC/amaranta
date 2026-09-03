import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { EVENT_PUBLISHER_PORT, EventPublisherPort } from '../../shared/domain/ports/event-publisher.port';
import { Order } from '../domain/entities/order.entity';
import { CheckoutCommand, CheckoutResult, CheckoutUseCasePort } from '../domain/ports/in/checkout.port';
import { ORDER_REPOSITORY_PORT, OrderRepositoryPort } from '../domain/ports/out/order-repository.port';
import { PRODUCT_STOCK_PORT, ProductStockPort } from '../domain/ports/out/product-stock.port';
import { toCheckoutResult } from './order.presenter';

@Injectable()
export class CheckoutUseCase implements CheckoutUseCasePort {
  constructor(
    @Inject(ORDER_REPOSITORY_PORT) private readonly orderRepository: OrderRepositoryPort,
    @Inject(PRODUCT_STOCK_PORT) private readonly productStock: ProductStockPort,
    @Inject(EVENT_PUBLISHER_PORT) private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CheckoutCommand): Promise<CheckoutResult> {
    // 1. Ask Catalog to validate and reserve stock (sync call today, REST tomorrow).
    const reservedLines = await this.productStock.reserve(
      command.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    );

    // 2. Build the aggregate — business rules live in Order.checkout(), not here.
    const order = Order.checkout({
      customerId: command.customerId,
      createdBy: command.createdBy,
      channel: command.channel,
      items: reservedLines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        unitPrice: Money.cop(line.unitPriceAmount),
        quantity: line.quantity,
      })),
      fulfillmentMethod: command.fulfillmentMethod,
      paymentMethod: command.paymentMethod,
      contactName: command.contactName,
      contactPhone: command.contactPhone,
      deliveryAddress: command.deliveryAddress,
    });

    // 3. Persist through the port.
    await this.orderRepository.save(order);

    // 4. Publish domain events through the port.
    for (const event of order.domainEvents) {
      await this.eventPublisher.publish(event);
    }
    order.clearEvents();

    return toCheckoutResult(order);
  }
}
