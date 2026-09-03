import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

@Entity({ name: 'order_items', schema: 'sales' })
export class OrderItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderOrmEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'product_name', length: 120 })
  productName: string;

  @Column({ name: 'unit_price_amount', type: 'integer' })
  unitPriceAmount: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'subtotal_amount', type: 'integer' })
  subtotalAmount: number;
}
