import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

type MockQueryBuilder = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let queryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
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

  it('throws not found for unknown id', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
