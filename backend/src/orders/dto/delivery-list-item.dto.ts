import { ApiProperty } from '@nestjs/swagger';

export class DeliveryListItemDto {
  @ApiProperty({ format: 'uuid', description: 'Delivery line id (order item id).' })
  deliveryId!: string;

  @ApiProperty({ format: 'uuid', description: 'Customer user id.' })
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: 'Line total at purchase price.' })
  totalPrice!: number;

  @ApiProperty()
  deliveryAddress!: string;

  @ApiProperty({ description: 'Whether this delivery line has been completed.' })
  completed!: boolean;

  @ApiProperty({ enum: ['processing', 'in-transit', 'delivered'] })
  itemStatus!: string;

  @ApiProperty()
  orderDate!: Date;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;
}
