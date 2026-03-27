import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const decimalToNumberTransformer = {
  to: (value: number) => value,
  // Postgres `decimal` TypeORM tarafından genelde string olarak döner.
  from: (value: string) => Number(value),
};

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', transformer: decimalToNumberTransformer })
  price!: number;

  @Column({ name: 'stock_quantity', type: 'int' })
  stockQuantity!: number;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ name: 'image_url', type: 'varchar' })
  imageUrl!: string;
}

