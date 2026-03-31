import 'reflect-metadata';

import { In } from 'typeorm';

import { AppDataSource } from '../../data-source';
import { Product } from '../../products/entities/product.entity';

const dummyProducts: Omit<Product, 'id'>[] = [
  {
    name: 'UltraBook Pro 15',
    description:
      '15 inç 4K ekran, Intel i7, 16 GB RAM, 512 GB SSD — günlük ve profesyonel kullanım için dizüstü bilgisayar.',
    price: 42999.99,
    stockQuantity: 12,
    category: 'Laptop',
    imageUrl: '/assets/products/laptop-ultrabook-pro-15.png',
  },
  {
    name: 'NovaPhone X',
    description:
      'AMOLED ekran, 5G, 256 GB depolama, çift SIM — güçlü kamera ve uzun pil ömrü ile akıllı telefon.',
    price: 18999.5,
    stockQuantity: 40,
    category: 'Smartphone',
    imageUrl: '/assets/products/smartphone-novaphone-x.jpg',
  },
  {
    name: 'SoundWave ANC 700',
    description:
      'Aktif gürültü engelleme, 30 saat pil, Bluetooth 5.3 — kablosuz kulak üstü kulaklık.',
    price: 3499.0,
    stockQuantity: 85,
    category: 'Headphones',
    imageUrl: '/assets/products/headphones-soundwave-anc-700.png',
  },
];

async function seedProducts(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      const names = dummyProducts.map((p) => p.name);
      const existing = await repo.find({ where: { name: In(names) } });
      const existingNames = new Set(existing.map((e) => e.name));
      const toInsert = dummyProducts.filter((p) => !existingNames.has(p.name));

      if (toInsert.length === 0) {
        console.log('Seed atlandı: örnek ürünler zaten veritabanında.');
        return;
      }

      await repo.save(repo.create(toInsert));
      console.log(`${toInsert.length} ürün eklendi.`);
    });
  } finally {
    await AppDataSource.destroy();
  }
}

seedProducts().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
