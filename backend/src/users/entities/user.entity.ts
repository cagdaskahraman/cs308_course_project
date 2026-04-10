import { Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Minimal user record for foreign keys (e.g. reviews). Extend when auth/users module is added. */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}
