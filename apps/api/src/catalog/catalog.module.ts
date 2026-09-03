import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './infrastructure/http/catalog.controller';
import { ListProductsUseCase } from './application/list-products.use-case';
import { ReserveStockUseCase } from './application/reserve-stock.use-case';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/out/product-repository.port';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [CatalogController],
  providers: [
    ListProductsUseCase,
    ReserveStockUseCase,
    { provide: PRODUCT_REPOSITORY_PORT, useClass: ProductRepository },
  ],
  // Exported so Sales can call ReserveStockUseCase in-process (today's REST-equivalent seam).
  exports: [ReserveStockUseCase],
})
export class CatalogModule {}
