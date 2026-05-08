import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { OrderItemStatus } from '../entities/order-item-status.enum';

export class UpdateOrderItemStatusDto {
  @ApiProperty({ enum: OrderItemStatus })
  @IsEnum(OrderItemStatus, {
    message: 'status must be one of: processing, in-transit, delivered',
  })
  status!: OrderItemStatus;
}
