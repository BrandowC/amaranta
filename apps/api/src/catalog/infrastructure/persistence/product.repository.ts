import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { PaginatedResult, ProductRepositoryPort } from '../../domain/ports/out/product-repository.port';
import { ProductOrmEntity } from './product.orm-entity';
import { ProductMapper } from './product.mapper';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findActivePaginated(page: number, pageSize: number): Promise<PaginatedResult<Product>> {
    const [rows, total] = await this.repo.findAndCount({
      where: { isActive: true },
      order: { name: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(ProductMapper.toDomain),
      page,
      pageSize,
      total,
    };
  }

  async findAllPaginated(page: number, pageSize: number): Promise<PaginatedResult<Product>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(ProductMapper.toDomain),
      page,
      pageSize,
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { sku } });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.findBy({ id: In(ids) });
    return rows.map(ProductMapper.toDomain);
  }

  async save(product: Product): Promise<void> {
    await this.repo.save(ProductMapper.toPersistence(product));
  }

  async saveMany(products: Product[]): Promise<void> {
    await this.repo.save(products.map(ProductMapper.toPersistence));
  }
}
