import { ApiProperty } from '@nestjs/swagger';

export class ProductDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Product name', example: 'iPhone 14' })
  name!: string;

  @ApiProperty({ description: 'Product description', example: 'Latest model' })
  description!: string;

  @ApiProperty({ description: 'Product price', example: 999.99, minimum: 0 })
  price!: number;

  @ApiProperty({ description: 'Available stock quantity', example: 10, minimum: 0 })
  stockQuantity!: number;

  @ApiProperty({ description: 'Product category', example: 'Smartphones' })
  category!: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/images/product.png',
  })
  imageUrl!: string;

  @ApiProperty({
    description:
      'Mean rating across **approved** reviews only (`approved = true`). `null` when there are no approved reviews.',
    example: 4.25,
    nullable: true,
    type: Number,
  })
  averageRating!: number | null;

  @ApiProperty({
    description: 'Number of **approved** reviews used for `averageRating`.',
    example: 12,
    minimum: 0,
  })
  reviewCount!: number;
}
