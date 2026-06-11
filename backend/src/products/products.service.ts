import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';

export type ProductWithReviewStats = Product & {
  averageRating: number;
  reviewCount: number;
};

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
  }): Promise<ProductWithReviewStats[]> {
    const qb = this.productsRepository.createQueryBuilder('p');
    qb.leftJoin(
      'reviews',
      'r',
      'r.product_id = p.id AND r.status = :approvedStatus',
      { approvedStatus: 'approved' },
    );

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

    qb.addSelect('COALESCE(AVG(r.rating), 0)', 'average_rating');
    qb.addSelect('COUNT(r.id)', 'review_count');
    qb.groupBy('p.id');

    if (options?.sortBy) {
      const dir = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
      if (options.sortBy === 'popularity') {
        // Popularity is strictly review count based.
        qb.orderBy('review_count', 'DESC').addOrderBy('p.name', 'ASC');
      } else {
        qb.orderBy('p.price', dir);
      }
    }

    const { entities, raw } = await qb.getRawAndEntities();
    return entities.map((entity, idx) => ({
      ...entity,
      averageRating: Number(raw[idx]?.average_rating ?? 0),
      reviewCount: Number(raw[idx]?.review_count ?? 0),
    }));
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productsRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category);
  }

  async findOne(id: string): Promise<ProductWithReviewStats> {
    const qb = this.productsRepository.createQueryBuilder('p');
    qb.leftJoin(
      'reviews',
      'r',
      'r.product_id = p.id AND r.status = :approvedStatus',
      { approvedStatus: 'approved' },
    );
    qb.where('p.id = :id', { id });
    qb.addSelect('COALESCE(AVG(r.rating), 0)', 'average_rating');
    qb.addSelect('COUNT(r.id)', 'review_count');
    qb.groupBy('p.id');

    const { entities, raw } = await qb.getRawAndEntities();
    const product = entities[0];
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return {
      ...product,
      averageRating: Number(raw[0]?.average_rating ?? 0),
      reviewCount: Number(raw[0]?.review_count ?? 0),
    };
  }
}
