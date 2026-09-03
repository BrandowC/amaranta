import { Order } from './order.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { OrderChannel } from '../value-objects/order-channel.enum';
import { OrderStatus } from '../value-objects/order-status.enum';
import { FulfillmentMethod } from '../value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../value-objects/payment-method.enum';

const validItem = {
  productId: 'product-1',
  productName: 'Croquetas',
  unitPrice: Money.cop(10000),
  quantity: 2,
};

function checkoutParams(overrides: Partial<Parameters<typeof Order.checkout>[0]> = {}) {
  return {
    customerId: 'c1',
    createdBy: 'c1',
    channel: OrderChannel.ONLINE,
    items: [validItem],
    fulfillmentMethod: FulfillmentMethod.PICKUP,
    paymentMethod: PaymentMethod.CASH,
    contactName: 'Ana Torres',
    contactPhone: '3001234567',
    ...overrides,
  };
}

describe('Order', () => {
  it('cannot be created without items', () => {
    expect(() => Order.checkout(checkoutParams({ items: [] }))).toThrow('INV-ORDER-004');
  });

  it('rejects duplicate products in the same order', () => {
    expect(() => Order.checkout(checkoutParams({ items: [validItem, validItem] }))).toThrow('INV-ORDER-003');
  });

  it('requires contact name and phone', () => {
    expect(() => Order.checkout(checkoutParams({ contactName: '  ' }))).toThrow('INV-ORDER-006');
    expect(() => Order.checkout(checkoutParams({ contactPhone: '' }))).toThrow('INV-ORDER-006');
  });

  it('requires a delivery address when fulfillmentMethod is DELIVERY', () => {
    expect(() =>
      Order.checkout(checkoutParams({ fulfillmentMethod: FulfillmentMethod.DELIVERY })),
    ).toThrow('INV-ORDER-007');
  });

  it('accepts a DELIVERY order when an address is given', () => {
    const order = Order.checkout(
      checkoutParams({ fulfillmentMethod: FulfillmentMethod.DELIVERY, deliveryAddress: 'Calle 10 # 5-20' }),
    );
    expect(order.deliveryAddress).toBe('Calle 10 # 5-20');
  });

  it('ignores a delivery address on a PICKUP order', () => {
    const order = Order.checkout(checkoutParams({ deliveryAddress: 'Calle 10 # 5-20' }));
    expect(order.deliveryAddress).toBeUndefined();
  });

  it('total always equals the sum of item subtotals', () => {
    const order = Order.checkout(checkoutParams());
    expect(order.total.amount).toBe(20000);
  });

  it('is created as PENDING and emits OrderCreated', () => {
    const order = Order.checkout(checkoutParams());
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.domainEvents).toHaveLength(1);
    expect(order.domainEvents[0].eventType).toBe('OrderCreated');
  });

  it('markAsPaid moves PENDING to PAID', () => {
    const order = Order.checkout(checkoutParams());
    order.markAsPaid();
    expect(order.status).toBe(OrderStatus.PAID);
  });

  it('cannot mark a non-PENDING order as paid twice', () => {
    const order = Order.checkout(checkoutParams());
    order.markAsPaid();
    expect(() => order.markAsPaid()).toThrow('INV-ORDER-005');
  });
});
