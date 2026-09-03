import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { OrderStatus } from '../../domain/value-objects/order-status.enum';
import { OrderChannel } from '../../domain/value-objects/order-channel.enum';
import { FulfillmentMethod } from '../../domain/value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../../domain/value-objects/payment-method.enum';
import { OrderItemOrmEntity } from './order-item.orm-entity';

@Entity({ name: 'orders', schema: 'sales' })
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 20, default: OrderChannel.ONLINE })
  channel: OrderChannel;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'total_amount', type: 'integer' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 20, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'fulfillment_method', type: 'varchar', length: 20, default: FulfillmentMethod.PICKUP })
  fulfillmentMethod: FulfillmentMethod;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ name: 'contact_name', type: 'varchar', length: 100 })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20 })
  contactPhone: string;

  @Column({ name: 'delivery_address', type: 'varchar', length: 255, nullable: true })
  deliveryAddress: string | null;

  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, { cascade: true, eager: true })
  items: OrderItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
