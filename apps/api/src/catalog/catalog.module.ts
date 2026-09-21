import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { CatalogController } from './infrastructure/http/catalog.controller';
import { AdminCatalogController } from './infrastructure/http/admin-catalog.controller';
import { ListProductsUseCase } from './application/list-products.use-case';
import { ReserveStockUseCase } from './application/reserve-stock.use-case';
import {
  CreateProductUseCase,
  ListAllProductsUseCase,
  SetProductActiveUseCase,
  SetProductStockUseCase,
  UpdateProductUseCase,
} from './application/manage-products.use-case';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/out/product-repository.port';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity]), IdentityModule],
  controllers: [CatalogController, AdminCatalogController],
  providers: [
    ListProductsUseCase,
    ReserveStockUseCase,
    ListAllProductsUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    SetProductStockUseCase,
    SetProductActiveUseCase,
    { provide: PRODUCT_REPOSITORY_PORT, useClass: ProductRepository },
  ],
  // Exported so Sales can call ReserveStockUseCase in-process (today's REST-equivalent seam).
  exports: [ReserveStockUseCase],
})
export class CatalogModule {}
