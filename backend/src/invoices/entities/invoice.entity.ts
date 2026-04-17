import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { decimalNumberTransformer } from '../../common/typeorm/decimal-number.transformer';
import { Order } from '../../orders/entities/order.entity';

@Entity('invoices')
export class Invoice {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Human-readable invoice number (e.g. INV-2026-000123).',
  })
  @Column({ name: 'invoice_number', type: 'varchar', unique: true })
  invoiceNumber!: string;

  @ApiProperty({
    description: 'Billing email captured at the time of checkout.',
  })
  @Column({ name: 'billing_email', type: 'varchar' })
  billingEmail!: string;

  @ApiProperty({
    description: 'Cardholder name captured at the time of checkout.',
  })
  @Column({ name: 'billing_name', type: 'varchar' })
  billingName!: string;

  @ApiProperty({
    description: 'Last 4 digits of the card used to pay for this invoice.',
  })
  @Column({ name: 'card_last4', type: 'varchar', length: 4 })
  cardLast4!: string;

  @ApiProperty({
    description: 'Mock gateway authorization reference.',
  })
  @Column({ name: 'authorization_reference', type: 'varchar' })
  authorizationReference!: string;

  @ApiProperty()
  @Column({
    type: 'decimal',
    transformer: decimalNumberTransformer,
  })
  subtotal!: number;

  @ApiProperty()
  @Column({
    type: 'decimal',
    transformer: decimalNumberTransformer,
  })
  total!: number;

  @OneToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ApiProperty()
  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;
}
