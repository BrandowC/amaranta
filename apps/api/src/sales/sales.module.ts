import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { SalesController } from './infrastructure/http/sales.controller';
import { CheckoutUseCase } from './application/checkout.use-case';
import { ListMyOrdersUseCase } from './application/list-my-orders.use-case';
import { ORDER_REPOSITORY_PORT } from './domain/ports/out/order-repository.port';
import { PRODUCT_STOCK_PORT } from './domain/ports/out/product-stock.port';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { CatalogStockAdapter } from './infrastructure/adapters/catalog-stock.adapter';
import { OrderCreatedListener } from './infrastructure/messaging/order-created.listener';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]), CatalogModule, IdentityModule],
  controllers: [SalesController],
  providers: [
    CheckoutUseCase,
    ListMyOrdersUseCase,
    OrderCreatedListener,
    { provide: ORDER_REPOSITORY_PORT, useClass: OrderRepository },
    { provide: PRODUCT_STOCK_PORT, useClass: CatalogStockAdapter },
  ],
})
export class SalesModule {}
