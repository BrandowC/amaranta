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
    const requested = command.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
    const reservedLines = await this.productStock.reserve(requested);

    // 2-3. Build the aggregate and persist it. Anything that fails from here until the order is
    // saved gives the reservation back: a rejected checkout must leave every stock untouched.
    // Event publishing is deliberately outside this block — once the order exists, its stock is spoken for.
    let order: Order;
    try {
      // Business rules live in Order.checkout(), not here.
      order = Order.checkout({
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
      await this.orderRepository.save(order);
    } catch (error) {
      await this.productStock.release(requested);
      throw error;
    }

    // 4. Publish domain events through the port.
    for (const event of order.domainEvents) {
      await this.eventPublisher.publish(event);
    }
    order.clearEvents();

    return toCheckoutResult(order);
  }
}
