import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { CartItem } from '../cart/entities/cart-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';

export function getDatabaseEnv(): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'postgres',
  };
}

/** NestJS runtime (`TypeOrmModule.forRoot`) — `data-source.ts` ile aynı ortam değişkenleri */
export function getTypeOrmModuleOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    ...getDatabaseEnv(),
    entities: [Product, Order, OrderItem, Cart, CartItem, User, Review, Invoice],
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
  };
}

/** TypeORM CLI migrations (`data-source.ts`) */
export function getDataSourceOptions(): DataSourceOptions {
  return {
    ...getTypeOrmModuleOptions(),
    migrations: ['src/migrations/*.{ts,js}'],
  } as DataSourceOptions;
}
