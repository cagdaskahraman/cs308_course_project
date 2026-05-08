import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewCommentDto } from './dto/update-review-comment.dto';
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
      .andWhere('orderItem.status = :delivered', {
        delivered: 'delivered',
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
      comment: null,
      pendingComment: null,
      status: ReviewStatus.APPROVED,
    });
    const saved = await this.reviewsRepository.save(review);
    await this.refreshProductPopularity(dto.productId);
    return saved;
  }

  async addComment(
    userId: string,
    productId: string,
    dto: UpdateReviewCommentDto,
  ): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
      relations: { product: true },
    });
    if (!review) {
      throw new NotFoundException(
        'You must submit a rating first before adding a comment',
      );
    }
    if (review.status !== ReviewStatus.APPROVED) {
      throw new ConflictException('Your rating is not in approved state');
    }
    const normalized = dto.comment.trim();
    review.pendingComment = normalized;
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
    if (status !== ReviewStatus.PENDING) {
      return [];
    }
    return this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.pending_comment IS NOT NULL')
      .orderBy('review.created_at', 'ASC')
      .getMany();
  }

  async approve(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!review) {
      throw new NotFoundException(`Review not found: ${id}`);
    }
    if (review.status !== ReviewStatus.PENDING) {
      if (!review.pendingComment) {
        throw new ConflictException(
          `Review ${id} has no pending comment to approve`,
        );
      }
    }
    review.comment = review.pendingComment;
    review.pendingComment = null;
    review.status = ReviewStatus.APPROVED;
    const saved = await this.reviewsRepository.save(review);
    await this.refreshProductPopularity(review.product.id);
    return saved;
  }

  async reject(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review not found: ${id}`);
    }
    if (!review.pendingComment) {
      throw new ConflictException(
        `Review ${id} has no pending comment to reject`,
      );
    }
    review.pendingComment = null;
    review.status = ReviewStatus.APPROVED;
    return this.reviewsRepository.save(review);
  }

  async getMineForProduct(userId: string, productId: string): Promise<Review | null> {
    return this.reviewsRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
  }

  private async refreshProductPopularity(productId: string): Promise<void> {
    const row = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('COALESCE(AVG(review.rating), 0)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne<{ avg: string; count: string }>();

    const average = Number(row?.avg ?? 0);
    const count = Number(row?.count ?? 0);
    const popularity = count;

    await this.productsRepository.update({ id: productId }, { popularity });
  }
}
