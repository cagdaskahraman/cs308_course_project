import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { decimalNumberTransformer } from '../../common/typeorm/decimal-number.transformer';
import { Product } from '../../products/entities/product.entity';
import { OrderItemStatus } from './order-item-status.enum';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'int' })
  quantity!: number;

  @ApiProperty()
  @Column({
    name: 'price_at_purchase',
    type: 'decimal',
    transformer: decimalNumberTransformer,
  })
  priceAtPurchase!: number;

  @ApiProperty({ enum: OrderItemStatus })
  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    enumName: 'order_item_status_enum',
    default: OrderItemStatus.Processing,
  })
  status!: OrderItemStatus;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
