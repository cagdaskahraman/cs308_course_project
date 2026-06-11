import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from './entities/review-status.enum';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewsRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let productsRepository: { findOne: jest.Mock; update: jest.Mock };
  let usersRepository: { findOne: jest.Mock };
  let orderItemsRepository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    reviewsRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'review-1', ...v })),
      createQueryBuilder: jest.fn(),
    };
    productsRepository = { findOne: jest.fn(), update: jest.fn() };
    usersRepository = { findOne: jest.fn() };
    orderItemsRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemsRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  function mockPurchased(): void {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(true),
    };
    orderItemsRepository.createQueryBuilder.mockReturnValue(qb);
  }

  function mockPopularityRecalculation(): void {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avg: '4.5', count: '2' }),
    };
    reviewsRepository.createQueryBuilder.mockReturnValue(qb);
  }

  it('creates approved rating immediately for delivered product', async () => {
    const dto: CreateReviewDto = { productId: 'prod-1', rating: 5 };
    productsRepository.findOne.mockResolvedValue({ id: 'prod-1' });
    usersRepository.findOne.mockResolvedValue({ id: 'user-1' });
    reviewsRepository.findOne.mockResolvedValue(null);
    mockPurchased();
    mockPopularityRecalculation();

    const saved = await service.create('user-1', dto);

    expect(saved.status).toBe(ReviewStatus.APPROVED);
    expect(saved.comment).toBeNull();
    expect(productsRepository.update).toHaveBeenCalled();
  });

  it('queues comment for moderation on approved rating', async () => {
    reviewsRepository.findOne.mockResolvedValue({
      id: 'review-1',
      status: ReviewStatus.APPROVED,
      product: { id: 'prod-1' },
    });
    const saved = await service.addComment('user-1', 'prod-1', {
      comment: 'Works great',
    });

    expect(saved.pendingComment).toBe('Works great');
    expect(saved.status).toBe(ReviewStatus.PENDING);
  });

  it('approves pending comment and keeps rating visible', async () => {
    reviewsRepository.findOne.mockResolvedValue({
      id: 'review-1',
      status: ReviewStatus.PENDING,
      pendingComment: 'Nice product',
      rating: 5,
      product: { id: 'prod-1' },
    });

    const saved = await service.approve('review-1');

    expect(saved.status).toBe(ReviewStatus.APPROVED);
    expect(saved.comment).toBe('Nice product');
    expect(saved.pendingComment).toBeNull();
  });

  it('rejects pending comment but keeps approved rating', async () => {
    reviewsRepository.findOne.mockResolvedValue({
      id: 'review-1',
      status: ReviewStatus.PENDING,
      pendingComment: 'Spam',
      rating: 4,
      product: { id: 'prod-1' },
    });

    const saved = await service.reject('review-1');

    expect(saved.status).toBe(ReviewStatus.APPROVED);
    expect(saved.pendingComment).toBeNull();
  });
});
