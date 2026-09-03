import { CheckoutUseCase } from './checkout.use-case';
import { Order } from '../domain/entities/order.entity';
import { OrderRepositoryPort } from '../domain/ports/out/order-repository.port';
import { ProductStockPort, ReservedStockLine, StockItemRequest } from '../domain/ports/out/product-stock.port';
import { EventPublisherPort } from '../../shared/domain/ports/event-publisher.port';
import { DomainEvent } from '../../shared/domain/domain-event';
import { OrderChannel } from '../domain/value-objects/order-channel.enum';
import { FulfillmentMethod } from '../domain/value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../domain/value-objects/payment-method.enum';

class InMemoryOrderRepository implements OrderRepositoryPort {
  orders: Order[] = [];
  async save(order: Order): Promise<void> {
    this.orders.push(order);
  }
  async findById(id: string): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }
  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.customerId === customerId);
  }
}

class FakeProductStockAdapter implements ProductStockPort {
  async reserve(items: StockItemRequest[]): Promise<ReservedStockLine[]> {
    return items.map((item) => ({
      productId: item.productId,
      productName: `Product ${item.productId}`,
      unitPriceAmount: 5000,
      quantity: item.quantity,
    }));
  }
}

class InMemoryEventPublisher implements EventPublisherPort {
  events: DomainEvent[] = [];
  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

describe('CheckoutUseCase', () => {
  it('reserves stock, saves the order and publishes OrderCreated', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const productStock = new FakeProductStockAdapter();
    const eventPublisher = new InMemoryEventPublisher();
    const useCase = new CheckoutUseCase(orderRepo, productStock, eventPublisher);

    const result = await useCase.execute({
      customerId: 'customer-1',
      createdBy: 'customer-1',
      channel: OrderChannel.ONLINE,
      items: [{ productId: 'product-1', quantity: 2 }],
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      paymentMethod: PaymentMethod.CASH,
      contactName: 'Ana Torres',
      contactPhone: '3001234567',
    });

    expect(orderRepo.orders).toHaveLength(1);
    expect(result.status).toBe('PENDING');
    expect(result.total).toBe(10000);
    expect(eventPublisher.events).toHaveLength(1);
    expect(eventPublisher.events[0].eventType).toBe('OrderCreated');
  });
});
