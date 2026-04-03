import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    name: 'status',
    required: true,
    title: 'Order status',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    description:
      'Target lifecycle state for the order. Allowed values: `processing`, `in-transit`, `delivered`, `cancelled`. ' +
      'Allowed transitions depend on the current status: ' +
      'from **processing** only to **in-transit** or **cancelled**; ' +
      'from **in-transit** only to **delivered**; ' +
      '**delivered** and **cancelled** are terminal and cannot change.',
    example: OrderStatus.InTransit,
    examples: {
      processing: {
        value: OrderStatus.Processing,
        summary: 'processing',
        description: 'Order is being prepared or awaiting fulfillment.',
      },
      inTransit: {
        value: OrderStatus.InTransit,
        summary: 'in-transit',
        description: 'Order has been handed off for shipment or is on the way.',
      },
      delivered: {
        value: OrderStatus.Delivered,
        summary: 'delivered',
        description: 'Order was successfully delivered to the customer.',
      },
      cancelled: {
        value: OrderStatus.Cancelled,
        summary: 'cancelled',
        description: 'Order was cancelled and will not be fulfilled.',
      },
    },
  })
  @IsEnum(OrderStatus, {
    message:
      'Status must be one of: processing, in-transit, delivered, cancelled (matching the OrderStatus enum).',
  })
  status!: OrderStatus;
}
