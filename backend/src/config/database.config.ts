import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Review } from '../reviews/entities/review.entity';

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
    entities: [Product, Order, OrderItem, Review],
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
