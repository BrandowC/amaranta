import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ProductCategory } from '../../domain/value-objects/product-category.enum';

@Entity({ name: 'products', schema: 'catalog' })
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  sku: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  category: ProductCategory;

  @Column({ name: 'price_amount', type: 'integer' })
  priceAmount: number;

  @Column({ name: 'stock_quantity', type: 'integer' })
  stockQuantity: number;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
