import { Controller, Get, Query, ServiceUnavailableException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { DataSource } from 'typeorm';
import { ListProducts } from '../application/list-products';

export class PaginationQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 50;
}

@Controller()
export class CatalogController {
  constructor(
    private readonly products: ListProducts,
    private readonly db: DataSource,
  ) {}

  @Get('v1/products')
  list(@Query() query: PaginationQuery) {
    return this.products.execute(query.page, query.pageSize);
  }

  @Get('health/live')
  live() {
    return { status: 'ok', service: 'catalog' };
  }

  @Get('health/ready')
  async ready() {
    try {
      // Check the owned schema too: connectivity alone does not imply readiness.
      await this.db.query('SELECT id FROM catalog.products LIMIT 0');
      return { status: 'ok', service: 'catalog', database: 'up' };
    } catch {
      throw new ServiceUnavailableException('Catalog database unavailable');
    }
  }
}
