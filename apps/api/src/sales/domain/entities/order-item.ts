import { DomainException } from '../../../shared/domain/domain-exception';
import { Money } from '../../../shared/domain/value-objects/money.vo';

export interface OrderItemProps {
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
}

/** Internal entity of the Order aggregate — has no meaning outside its Order. */
export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  static create(props: OrderItemProps): OrderItem {
    if (props.quantity < 1 || props.quantity > 50) {
      throw new DomainException('INV-ORDER-ITEM-001', 'quantity must be between 1 and 50');
    }
    return new OrderItem(props);
  }

  get productId(): string {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get subtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }
}
