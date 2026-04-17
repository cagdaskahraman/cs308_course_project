import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from './entities/review-status.enum';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found: ${dto.productId}`);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const review = this.reviewsRepository.create({
      product,
      user,
      rating: dto.rating,
      comment: dto.comment,
      status: ReviewStatus.PENDING,
    });
    return this.reviewsRepository.save(review);
  }

  async listByProduct(
    productId: string,
    status: ReviewStatus = ReviewStatus.APPROVED,
  ): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { product: { id: productId }, status },
      relations: { product: false, user: false },
      order: { createdAt: 'DESC' },
    });
  }
}
