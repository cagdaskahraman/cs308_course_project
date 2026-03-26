import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal' })
  price: string;

  @Column({ name: 'stock_quantity', type: 'int' })
  stockQuantity: number;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ name: 'image_url', type: 'varchar' })
  imageUrl: string;
}

