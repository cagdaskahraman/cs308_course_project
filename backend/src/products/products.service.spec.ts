import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

type MockQueryBuilder = {
  leftJoin: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  where: jest.Mock;
  getRawAndEntities: jest.Mock;
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: {
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawAndEntities: jest
        .fn()
        .mockResolvedValue({ entities: [], raw: [] }),
    };

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('orders by price ascending when sortBy=price and sortOrder=asc', async () => {
    await service.findAll({ sortBy: 'price', sortOrder: 'asc' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('p.price', 'ASC');
  });

  it('orders by price descending when sortBy=price and sortOrder=desc', async () => {
    await service.findAll({ sortBy: 'price', sortOrder: 'desc' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('p.price', 'DESC');
  });

  it('orders by review count descending when sortBy=popularity', async () => {
    await service.findAll({ sortBy: 'popularity', sortOrder: 'asc' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('review_count', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('p.name', 'ASC');
  });

  it('throws not found for unknown id', async () => {
    queryBuilder.getRawAndEntities.mockResolvedValue({
      entities: [],
      raw: [],
    });

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
