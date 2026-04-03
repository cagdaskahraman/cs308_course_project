import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { decimalNumberTransformer } from '../../common/typeorm/decimal-number.transformer';
import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'order_date', type: 'timestamptz' })
  orderDate!: Date;

  @Column({
    name: 'total_price',
    type: 'decimal',
    transformer: decimalNumberTransformer,
  })
  totalPrice!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status_enum',
  })
  status!: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
