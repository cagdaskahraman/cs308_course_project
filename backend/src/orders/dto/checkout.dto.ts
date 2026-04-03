import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';

import { CheckoutItemDto } from './checkout-item.dto';

export class CheckoutDto {
  @ApiProperty({
    type: () => [CheckoutItemDto],
    isArray: true,
    description:
      'Line items for this checkout. Each entry specifies a product and how many units to buy. ' +
      'At least one line item is required; the same product may appear more than once (processed in order).',
    example: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      },
      {
        productId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        quantity: 3,
      },
    ],
  })
  @IsArray({
    message: 'Items must be provided as an array of checkout lines.',
  })
  @ArrayMinSize(1, {
    message: 'Checkout must include at least one line item (product and quantity).',
  })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];
}

