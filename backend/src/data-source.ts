import 'reflect-metadata';

import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

import { Product } from './products/entities/product.entity';

// `backend/` klasöründen `.env` yüklemek için (CLI çalıştırırken cwd genelde backend olur)
loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',

  // Migration üretimi/çalıştırması için entity listesi
  entities: [Product],

  // Migration dosyaları bu klasöre yazılacak/okunacak
  migrations: ['src/migrations/*.{ts,js}'],

  // Geliştirme kolaylığı; prod için ayrıca kontrollü kullanın
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
