import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from '../../../identity/infrastructure/security/roles.guard';
import { Roles } from '../../../identity/infrastructure/security/roles.decorator';
import { UserRole } from '../../../identity/domain/value-objects/user-role.enum';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { UpdateProductRequestDto } from './dto/update-product-request.dto';
import { SetProductStockRequestDto } from './dto/set-product-stock-request.dto';
import {
  CreateProductUseCasePort,
  ListAllProductsUseCasePort,
  SetProductActiveUseCasePort,
  SetProductStockUseCasePort,
  UpdateProductUseCasePort,
} from '../../domain/ports/in/manage-products.port';
import {
  CreateProductUseCase,
  ListAllProductsUseCase,
  SetProductActiveUseCase,
  SetProductStockUseCase,
  UpdateProductUseCase,
} from '../../application/manage-products.use-case';

@ApiTags('catalog-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/products')
export class AdminCatalogController {
  constructor(
    @Inject(ListAllProductsUseCase) private readonly listAllProducts: ListAllProductsUseCasePort,
    @Inject(CreateProductUseCase) private readonly createProduct: CreateProductUseCasePort,
    @Inject(UpdateProductUseCase) private readonly updateProduct: UpdateProductUseCasePort,
    @Inject(SetProductStockUseCase) private readonly setProductStock: SetProductStockUseCasePort,
    @Inject(SetProductActiveUseCase) private readonly setProductActive: SetProductActiveUseCasePort,
  ) {}

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.listAllProducts.execute({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateProductRequestDto) {
    return this.createProduct.execute(body);
  }

  @Patch(':productId')
  update(@Param('productId') productId: string, @Body() body: UpdateProductRequestDto) {
    return this.updateProduct.execute({ productId, ...body });
  }

  @Patch(':productId/stock')
  setStock(@Param('productId') productId: string, @Body() body: SetProductStockRequestDto) {
    return this.setProductStock.execute({ productId, stockQuantity: body.stockQuantity });
  }

  @Post(':productId/deactivate')
  deactivate(@Param('productId') productId: string) {
    return this.setProductActive.execute({ productId, isActive: false });
  }

  @Post(':productId/activate')
  activate(@Param('productId') productId: string) {
    return this.setProductActive.execute({ productId, isActive: true });
  }
}
