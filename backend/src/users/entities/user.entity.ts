import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { encryptedColumnTransformer } from '../../common/crypto/encrypted-column.transformer';

export enum UserRole {
  CUSTOMER = 'customer',
  PRODUCT_MANAGER = 'product_manager',
  SALES_MANAGER = 'sales_manager',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Kept plaintext: used as login identifier and queried for uniqueness.
  // Passwords are bcrypt-hashed; profile PII below is AES-256-GCM encrypted.
  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  fullName!: string | null;

  @Column({
    name: 'tax_id',
    type: 'varchar',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  taxId!: string | null;

  @Column({
    name: 'home_address',
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  homeAddress!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', select: false })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
