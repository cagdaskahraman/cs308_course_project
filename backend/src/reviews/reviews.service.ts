import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
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
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
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

    const hasPurchased = await this.orderItemsRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('order.user_id = :userId', { userId })
      .andWhere('orderItem.product_id = :productId', { productId: dto.productId })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.Cancelled,
      })
      .getExists();

    if (!hasPurchased) {
      throw new ForbiddenException(
        'You can only review products that you have purchased',
      );
    }

    const existingReview = await this.reviewsRepository.findOne({
      where: { user: { id: userId }, product: { id: dto.productId } },
    });
    if (existingReview) {
      throw new ConflictException(
        'You have already submitted a review for this product',
      );
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

  async listForModeration(status: ReviewStatus): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { status },
      relations: { product: false, user: false },
      order: { createdAt: 'ASC' },
    });
  }

  async approve(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review not found: ${id}`);
    }
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException(
        `Review ${id} is not pending (current: ${review.status})`,
      );
    }
    review.status = ReviewStatus.APPROVED;
    return this.reviewsRepository.save(review);
  }

  async reject(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review not found: ${id}`);
    }
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException(
        `Review ${id} is not pending (current: ${review.status})`,
      );
    }
    review.status = ReviewStatus.REJECTED;
    return this.reviewsRepository.save(review);
  }
}
