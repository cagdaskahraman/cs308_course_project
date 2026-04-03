import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    enumName: 'OrderStatus',
    description:
      'Target lifecycle state for the order. Allowed transitions depend on the current status: ' +
      'from **processing** only to **in-transit** or **cancelled**; ' +
      'from **in-transit** only to **delivered**; ' +
      '**delivered** and **cancelled** are terminal and cannot change.',
    example: OrderStatus.InTransit,
    examples: {
      processing: { value: OrderStatus.Processing, summary: 'New / being prepared' },
      inTransit: { value: OrderStatus.InTransit, summary: 'Shipped / on the way' },
      delivered: { value: OrderStatus.Delivered, summary: 'Completed delivery' },
      cancelled: { value: OrderStatus.Cancelled, summary: 'Order cancelled' },
    },
  })
  @IsEnum(OrderStatus, {
    message:
      'Status must be one of: processing, in-transit, delivered, cancelled (matching the OrderStatus enum).',
  })
  status!: OrderStatus;
}
