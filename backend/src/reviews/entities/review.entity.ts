import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewStatus } from './review-status.enum';

@Entity('reviews')
@Index('IDX_reviews_product_status', ['product', 'status'])
export class Review {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Column({ type: 'int' })
  rating!: number;

  @ApiProperty()
  @Column({ type: 'text' })
  comment!: string;

  @ApiProperty({ enum: ReviewStatus })
  @Column({
    type: 'enum',
    enum: ReviewStatus,
    enumName: 'review_status_enum',
    default: ReviewStatus.PENDING,
  })
  status!: ReviewStatus;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
