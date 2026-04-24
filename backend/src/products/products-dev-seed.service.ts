import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { dbProductsSeed, validateDbProductsSeed } from './products.seed';

@Injectable()
export class ProductsDevSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductsDevSeedService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && process.env.AUTO_SEED_PRODUCTS !== 'true') {
      return;
    }

    const count = await this.productsRepository.count();
    if (count > 0) {
      return;
    }

    validateDbProductsSeed(dbProductsSeed);
    await this.productsRepository.save(
      this.productsRepository.create(dbProductsSeed as Omit<Product, 'id'>[]),
    );
    this.logger.log(`${dbProductsSeed.length} demo products seeded (database was empty).`);
  }
}
