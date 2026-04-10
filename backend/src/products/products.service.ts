import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '../reviews/entities/review.entity';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
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
      if (options.sortBy === 'price') {
        qb.orderBy('p.price', dir);
      } else {
        qb.orderBy('p.stockQuantity', dir);
      }
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

  async findOne(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    const raw = await this.reviewRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'cnt')
      .where('r.product_id = :productId', { productId: id })
      .andWhere('r.approved = :approved', { approved: true })
      .getRawOne<{ avg: string | null; cnt: string }>();

    const reviewCount = Number(raw?.cnt ?? 0);
    const averageRating =
      reviewCount === 0 || raw?.avg == null
        ? null
        : Math.round(Number(raw.avg) * 100) / 100;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      category: product.category,
      imageUrl: product.imageUrl,
      averageRating,
      reviewCount,
    };
  }
}
