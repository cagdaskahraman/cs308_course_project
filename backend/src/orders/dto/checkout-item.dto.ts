import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({
    name: 'productId',
    required: true,
    format: 'uuid',
    title: 'Product ID',
    description:
      'Unique identifier of the product to purchase. Must be a valid UUID v4 that exists in the catalog.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', {
    message:
      'Product ID must be a valid UUID v4 string (e.g. 550e8400-e29b-41d4-a716-446655440000).',
  })
  productId!: string;

  @ApiProperty({
    name: 'quantity',
    required: true,
    type: 'integer',
    minimum: 1,
    title: 'Quantity',
    description:
      'Number of units to order for this product. Must be a whole number; partial quantities are not allowed.',
    example: 2,
  })
  @Type(() => Number)
  @IsInt({
    message: 'Quantity must be a valid integer (no decimals).',
  })
  @Min(1, {
    message: 'Quantity must be a valid integer greater than zero.',
  })
  quantity!: number;
}
