import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { encryptedColumnTransformer } from '../../common/crypto/encrypted-column.transformer';
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
  @Column({
    name: 'billing_email',
    type: 'varchar',
    transformer: encryptedColumnTransformer,
  })
  billingEmail!: string;

  @ApiProperty({
    description: 'Cardholder name captured at the time of checkout.',
  })
  @Column({
    name: 'billing_name',
    type: 'varchar',
    transformer: encryptedColumnTransformer,
  })
  billingName!: string;

  @ApiProperty({
    description: 'Customer tax identifier captured at checkout time.',
    required: false,
  })
  @Column({
    name: 'tax_id',
    type: 'varchar',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  taxId!: string | null;

  @ApiProperty({
    description: 'Delivery/billing address printed on invoice.',
  })
  @Column({
    name: 'billing_address',
    type: 'text',
    transformer: encryptedColumnTransformer,
  })
  billingAddress!: string;

  @ApiProperty({
    description: 'Last 4 digits of the card used to pay for this invoice.',
  })
  @Column({
    name: 'card_last4',
    type: 'varchar',
    transformer: encryptedColumnTransformer,
  })
  cardLast4!: string;

  @ApiProperty({
    description: 'Mock gateway authorization reference.',
  })
  @Column({
    name: 'authorization_reference',
    type: 'varchar',
    transformer: encryptedColumnTransformer,
  })
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
