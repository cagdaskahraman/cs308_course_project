import 'reflect-metadata';

import { AppDataSource } from '../../data-source';
import { Product } from '../../products/entities/product.entity';
import {
  dbProductsSeed,
  validateDbProductsSeed,
} from '../../products/products.seed';

export async function seedProducts(): Promise<void> {
  validateDbProductsSeed(dbProductsSeed);
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      // Keep seeding idempotent even when FK-linked rows exist (order_items/cart_items).
      await manager.query(`
        TRUNCATE TABLE
          "order_items",
          "cart_items",
          "orders",
          "carts",
          "products"
        RESTART IDENTITY CASCADE
      `);
      await repo.save(repo.create(dbProductsSeed as Omit<Product, 'id'>[]));
      console.log(`${dbProductsSeed.length} products seeded.`);
    });
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  seedProducts().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
