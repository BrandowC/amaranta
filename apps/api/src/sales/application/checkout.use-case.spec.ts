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
  reserved: StockItemRequest[][] = [];
  released: StockItemRequest[][] = [];

  async reserve(items: StockItemRequest[]): Promise<ReservedStockLine[]> {
    this.reserved.push(items);
    return items.map((item) => ({
      productId: item.productId,
      productName: `Product ${item.productId}`,
      unitPriceAmount: 5000,
      quantity: item.quantity,
    }));
  }

  async release(items: StockItemRequest[]): Promise<void> {
    this.released.push(items);
  }
}

class InMemoryEventPublisher implements EventPublisherPort {
  events: DomainEvent[] = [];
  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

const validCommand = {
  customerId: 'customer-1',
  createdBy: 'customer-1',
  channel: OrderChannel.ONLINE,
  items: [{ productId: 'product-1', quantity: 2 }],
  fulfillmentMethod: FulfillmentMethod.PICKUP,
  paymentMethod: PaymentMethod.CASH,
  contactName: 'Ana Torres',
  contactPhone: '3001234567',
};

function nextMondayAt(hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d;
}

function nextSundayAt(hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe('CheckoutUseCase', () => {
  beforeEach(() => {
    // Pin "now" inside shop hours (INV-ORDER-008) so this test doesn't depend on wall-clock time.
    jest.useFakeTimers().setSystemTime(nextMondayAt(10));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
    expect(productStock.released).toHaveLength(0);
  });

  describe('a rejected checkout leaves the stock of every product unchanged', () => {
    function build() {
      const orderRepo = new InMemoryOrderRepository();
      const productStock = new FakeProductStockAdapter();
      const eventPublisher = new InMemoryEventPublisher();
      return { orderRepo, productStock, eventPublisher, useCase: new CheckoutUseCase(orderRepo, productStock, eventPublisher) };
    }

    it('releases the reservation when the aggregate rejects the order (INV-ORDER-006)', async () => {
      const { orderRepo, productStock, eventPublisher, useCase } = build();

      await expect(useCase.execute({ ...validCommand, contactName: '   ' })).rejects.toMatchObject({
        code: 'INV-ORDER-006',
      });

      expect(productStock.released).toEqual(productStock.reserved);
      expect(orderRepo.orders).toHaveLength(0);
      expect(eventPublisher.events).toHaveLength(0);
    });

    it('releases the reservation when the store is closed (INV-ORDER-008)', async () => {
      jest.setSystemTime(nextSundayAt(10));
      const { productStock, useCase } = build();

      await expect(useCase.execute(validCommand)).rejects.toMatchObject({ code: 'INV-ORDER-008' });

      expect(productStock.reserved).toHaveLength(1);
      expect(productStock.released).toEqual(productStock.reserved);
    });

    it('releases the reservation when the same product appears on two lines (INV-ORDER-003)', async () => {
      const { productStock, useCase } = build();
      const items = [
        { productId: 'product-1', quantity: 1 },
        { productId: 'product-1', quantity: 1 },
      ];

      await expect(useCase.execute({ ...validCommand, items })).rejects.toMatchObject({ code: 'INV-ORDER-003' });

      expect(productStock.released).toEqual([items]);
    });

    it('releases the reservation when saving the order fails', async () => {
      const { orderRepo, productStock, eventPublisher, useCase } = build();
      jest.spyOn(orderRepo, 'save').mockRejectedValue(new Error('connection lost'));

      await expect(useCase.execute(validCommand)).rejects.toThrow('connection lost');

      expect(productStock.released).toEqual(productStock.reserved);
      expect(eventPublisher.events).toHaveLength(0);
    });

    it('keeps the reservation when only publishing the event fails, because the order already exists', async () => {
      const { orderRepo, productStock, eventPublisher, useCase } = build();
      jest.spyOn(eventPublisher, 'publish').mockRejectedValue(new Error('bus down'));

      await expect(useCase.execute(validCommand)).rejects.toThrow('bus down');

      expect(orderRepo.orders).toHaveLength(1);
      expect(productStock.released).toHaveLength(0);
    });
  });
});
