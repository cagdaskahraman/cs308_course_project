import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(options?: {
    search?: string;
    category?: string;
    sortBy?: 'price' | 'popularity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Product[]> {
    const qb = this.productsRepository.createQueryBuilder('p');

    if (options?.search?.trim()) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.name) LIKE :term OR LOWER(p.description) LIKE :term)',
        { term },
      );
    }

    if (options?.category?.trim()) {
      qb.andWhere('LOWER(p.category) = LOWER(:category)', {
        category: options.category.trim(),
      });
    }

    if (options?.sortBy) {
      const dir = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
      qb.orderBy(
        options.sortBy === 'popularity' ? 'p.popularity' : 'p.price',
        dir,
      );
    }

    return qb.getMany();
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productsRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return product;
  }
}
