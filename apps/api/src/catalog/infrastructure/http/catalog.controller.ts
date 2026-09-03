import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListProductsUseCasePort } from '../../domain/ports/in/list-products.port';
import { ListProductsUseCase } from '../../application/list-products.use-case';

@ApiTags('catalog')
@Controller('products')
export class CatalogController {
  constructor(@Inject(ListProductsUseCase) private readonly listProducts: ListProductsUseCasePort) {}

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.listProducts.execute({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }
}
