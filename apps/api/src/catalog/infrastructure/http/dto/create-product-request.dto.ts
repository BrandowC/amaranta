import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString, IsUrl, Length, Min } from 'class-validator';
import { ProductCategory } from '../../../domain/value-objects/product-category.enum';

export class CreateProductRequestDto {
  @ApiProperty({ example: 'FOOD-DOG-001' })
  @IsString()
  @Length(2, 50)
  sku: string;

  @ApiProperty({ example: 'Croquetas para perro adulto 3kg' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ example: 'Alimento balanceado para perros adultos de cualquier raza' })
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.FOOD })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ example: 45000, description: 'Price in COP, integer' })
  @IsInt()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ example: 'https://example.com/images/dog-food.jpg' })
  @IsUrl()
  imageUrl: string;
}
