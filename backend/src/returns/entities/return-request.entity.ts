import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { decimalNumberTransformer } from '../../common/typeorm/decimal-number.transformer';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { ReturnStatus } from './return-status.enum';

@Entity('return_requests')
export class ReturnRequest {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => OrderItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem!: OrderItem;

  @ApiProperty()
  @Column({ type: 'int' })
  quantity!: number;

  @ApiProperty()
  @Column({
    name: 'refund_amount',
    type: 'decimal',
    transformer: decimalNumberTransformer,
  })
  refundAmount!: number;

  @ApiProperty({ enum: ReturnStatus })
  @Column({
    type: 'enum',
    enum: ReturnStatus,
    enumName: 'return_status_enum',
    default: ReturnStatus.Pending,
  })
  status!: ReturnStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamptz' })
  requestedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
