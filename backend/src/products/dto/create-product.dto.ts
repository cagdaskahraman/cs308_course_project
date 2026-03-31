import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 14' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Product description', example: 'Latest model' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Product price', example: 999.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Available stock quantity', example: 10, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @ApiProperty({ description: 'Product category', example: 'Smartphones' })
  @IsString()
  category!: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/images/product.png',
  })
  @IsString()
  imageUrl!: string;
}

