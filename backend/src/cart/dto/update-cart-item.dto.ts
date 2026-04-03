import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// DTO for updating cart item quantity
export class UpdateCartItemDto {
  @ApiProperty({ type: 'integer', minimum: 1, example: 2 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be a valid integer.' })
  @Min(1, { message: 'Quantity must be at least 1.' })
  quantity!: number;
}
