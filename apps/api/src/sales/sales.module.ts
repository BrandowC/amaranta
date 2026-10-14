import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { ReleaseStockUseCase } from '../catalog/application/release-stock.use-case';
import { ReserveStockUseCase } from '../catalog/application/reserve-stock.use-case';
import { IdentityModule } from '../identity/identity.module';
import { SalesController } from './infrastructure/http/sales.controller';
import { CheckoutUseCase } from './application/checkout.use-case';
import { ListMyOrdersUseCase } from './application/list-my-orders.use-case';
import { MarkOrderAsPaidUseCase } from './application/mark-order-as-paid.use-case';
import { ORDER_REPOSITORY_PORT } from './domain/ports/out/order-repository.port';
import { PRODUCT_STOCK_PORT } from './domain/ports/out/product-stock.port';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { CatalogStockAdapter } from './infrastructure/adapters/catalog-stock.adapter';
import { HttpCatalogStockAdapter } from './infrastructure/adapters/http-catalog-stock.adapter';
import { OrderCreatedListener } from './infrastructure/messaging/order-created.listener';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    ConfigModule,
    CatalogModule,
    IdentityModule,
  ],
  controllers: [SalesController],
  providers: [
    CheckoutUseCase,
    ListMyOrdersUseCase,
    MarkOrderAsPaidUseCase,
    OrderCreatedListener,
    { provide: ORDER_REPOSITORY_PORT, useClass: OrderRepository },
    {
      provide: PRODUCT_STOCK_PORT,
      inject: [ConfigService, ReserveStockUseCase, ReleaseStockUseCase],
      useFactory: (
        config: ConfigService,
        reserveStock: ReserveStockUseCase,
        releaseStock: ReleaseStockUseCase,
      ) => {
        const catalogServiceUrl = config.get<string>('CATALOG_SERVICE_URL');
        return catalogServiceUrl
          ? new HttpCatalogStockAdapter(catalogServiceUrl)
          : new CatalogStockAdapter(reserveStock, releaseStock);
      },
    },
  ],
})
export class SalesModule {}
