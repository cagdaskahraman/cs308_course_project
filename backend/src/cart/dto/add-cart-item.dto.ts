import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

// DTO for adding an item to cart
export class AddCartItemDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: 'Cart ID must be a valid UUID v4.' })
  cartId!: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID v4.' })
  productId!: string;

  @ApiProperty({ type: 'integer', minimum: 1, example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be a valid integer.' })
  @Min(1, { message: 'Quantity must be at least 1.' })
  quantity!: number;
}
