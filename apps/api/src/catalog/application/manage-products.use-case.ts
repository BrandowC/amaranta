import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { Product } from '../domain/entities/product.entity';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../domain/ports/out/product-repository.port';
import {
  AdminProductView,
  CreateProductCommand,
  CreateProductUseCasePort,
  ListAllProductsQuery,
  ListAllProductsResult,
  ListAllProductsUseCasePort,
  SetProductActiveCommand,
  SetProductActiveUseCasePort,
  SetProductStockCommand,
  SetProductStockUseCasePort,
  UpdateProductCommand,
  UpdateProductUseCasePort,
} from '../domain/ports/in/manage-products.port';

const MAX_PAGE_SIZE = 50;

function toAdminView(product: Product): AdminProductView {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price.amount,
    priceFormatted: product.price.format(),
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
  };
}

async function loadOrThrow(repo: ProductRepositoryPort, productId: string): Promise<Product> {
  const product = await repo.findById(productId);
  if (!product) throw new NotFoundException(`Product "${productId}" was not found`);
  return product;
}

@Injectable()
export class ListAllProductsUseCase implements ListAllProductsUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(query: ListAllProductsQuery): Promise<ListAllProductsResult> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize || MAX_PAGE_SIZE));
    const result = await this.productRepository.findAllPaginated(page, pageSize);
    return { items: result.items.map(toAdminView), page: result.page, pageSize: result.pageSize, total: result.total };
  }
}

@Injectable()
export class CreateProductUseCase implements CreateProductUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: CreateProductCommand): Promise<AdminProductView> {
    const existing = await this.productRepository.findBySku(command.sku.trim());
    if (existing) {
      throw new DomainException('SKU_ALREADY_EXISTS', `A product with sku "${command.sku}" already exists`);
    }

    const product = Product.create({
      sku: command.sku,
      name: command.name,
      description: command.description,
      category: command.category,
      price: Money.cop(command.price),
      stockQuantity: command.stockQuantity,
      imageUrl: command.imageUrl,
    });

    await this.productRepository.save(product);
    return toAdminView(product);
  }
}

@Injectable()
export class UpdateProductUseCase implements UpdateProductUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: UpdateProductCommand): Promise<AdminProductView> {
    const product = await loadOrThrow(this.productRepository, command.productId);
    product.updateDetails({
      name: command.name,
      description: command.description,
      category: command.category,
      price: command.price !== undefined ? Money.cop(command.price) : undefined,
      imageUrl: command.imageUrl,
    });
    await this.productRepository.save(product);
    return toAdminView(product);
  }
}

@Injectable()
export class SetProductStockUseCase implements SetProductStockUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: SetProductStockCommand): Promise<AdminProductView> {
    const product = await loadOrThrow(this.productRepository, command.productId);
    product.setStockQuantity(command.stockQuantity);
    await this.productRepository.save(product);
    return toAdminView(product);
  }
}

@Injectable()
export class SetProductActiveUseCase implements SetProductActiveUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: SetProductActiveCommand): Promise<AdminProductView> {
    const product = await loadOrThrow(this.productRepository, command.productId);
    if (command.isActive) product.activate();
    else product.deactivate();
    await this.productRepository.save(product);
    return toAdminView(product);
  }
}
