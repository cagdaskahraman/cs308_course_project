import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductReviewResponseDto } from './dto/product-review-response.dto';
import { Review } from './entities/review.entity';
import { maskEmail } from './utils/mask-email';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    productId: string,
    dto: CreateReviewDto,
    userId: string,
  ): Promise<Review> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const review = this.reviewRepository.create({
      product,
      user,
      rating: dto.rating,
      comment: dto.comment,
      approved: false,
    });

    return this.reviewRepository.save(review);
  }

  async findByProduct(
    productId: string,
    approvedOnly: boolean,
  ): Promise<ProductReviewResponseDto[]> {
    const productExists = await this.productRepository.exists({
      where: { id: productId },
    });
    if (!productExists) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    const where: FindOptionsWhere<Review> = {
      product: { id: productId },
    };
    if (approvedOnly) {
      where.approved = true;
    }

    const reviews = await this.reviewRepository.find({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.toProductReviewResponse(review));
  }

  private toProductReviewResponse(review: Review): ProductReviewResponseDto {
    const user = review.user;
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      approved: review.approved,
      createdAt: review.createdAt.toISOString(),
      author: {
        maskedEmail: maskEmail(user.email),
        displayName: user.displayName,
      },
    };
  }
}
