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

  it('creates rating for delivered product', async () => {
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

  it('adds pending comment to existing rating', async () => {
    productsRepository.findOne.mockResolvedValue({ id: 'prod-1' });
    reviewsRepository.findOne.mockResolvedValue({
      id: 'review-1',
      status: ReviewStatus.APPROVED,
      product: { id: 'prod-1' },
    });
    const saved = await service.addComment('user-1', 'prod-1', {
      comment: 'Works great',
    });

    expect(saved.pendingComment).toBe('Works great');
  });
});
