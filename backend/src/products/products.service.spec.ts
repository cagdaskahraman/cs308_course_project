import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

type MockQueryBuilder = {
  select: jest.Mock;
  leftJoin: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  where: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  getMany: jest.Mock;
  getRawMany: jest.Mock;
  getRawAndEntities: jest.Mock;
  getOne: jest.Mock;
  getCount: jest.Mock;
  execute: jest.Mock;
};

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let categoryRepository: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let orderItemsRepository: { count: jest.Mock };
  let queryBuilder: MockQueryBuilder;

  const makeQueryBuilder = (overrides?: Partial<MockQueryBuilder>): MockQueryBuilder => ({
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
    ...overrides,
  });

  beforeEach(() => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    productRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn((entity: Partial<Product>) => ({ id: 'new-id', ...entity })),
      save: jest.fn(async (entity: Product) => entity),
      findOne: jest.fn(),
      remove: jest.fn(async () => undefined),
    };
    categoryRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((entity: Partial<ProductCategory>) => ({ id: 'cat-id', ...entity })),
      save: jest.fn(async (entity: ProductCategory) => entity),
      remove: jest.fn(async () => undefined),
    };
    orderItemsRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    service = new ProductsService(
      productRepository as unknown as Repository<Product>,
      categoryRepository as unknown as Repository<ProductCategory>,
      orderItemsRepository as unknown as Repository<OrderItem>,
    );
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

  it('creates a product after normalizing text fields and ensuring category exists', async () => {
    productRepository.createQueryBuilder
      .mockReturnValueOnce(makeQueryBuilder({ getOne: jest.fn().mockResolvedValue(null) }))
      .mockReturnValueOnce(makeQueryBuilder({ getCount: jest.fn().mockResolvedValue(0) }));
    categoryRepository.createQueryBuilder.mockReturnValueOnce(
      makeQueryBuilder({ getCount: jest.fn().mockResolvedValue(0) }),
    );

    await service.createProduct({
      name: '  Camera X  ',
      model: ' X100 ',
      serialNumber: ' SN-CAM-1 ',
      description: ' Compact camera ',
      category: ' Camera ',
      imageUrl: ' https://example.com/camera.jpg ',
      price: 100,
      stockQuantity: 5,
      warrantyStatus: ' 2 years ',
      distributorInfo: ' Demo distributor ',
      popularity: 10,
    });

    expect(categoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Camera' }),
    );
    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Camera X',
        model: 'X100',
        serialNumber: 'SN-CAM-1',
        category: 'Camera',
      }),
    );
  });

  it('rejects duplicate serial numbers when creating products', async () => {
    productRepository.createQueryBuilder.mockReturnValueOnce(
      makeQueryBuilder({ getOne: jest.fn().mockResolvedValue({ id: 'existing-id' }) }),
    );

    await expect(
      service.createProduct({
        name: 'Camera X',
        model: 'X100',
        serialNumber: 'SN-CAM-1',
        description: 'Compact camera',
        category: 'Camera',
        imageUrl: 'https://example.com/camera.jpg',
        price: 100,
        stockQuantity: 5,
        warrantyStatus: '2 years',
        distributorInfo: 'Demo distributor',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates only stock quantity through the stock helper', async () => {
    const product = { id: 'product-id', stockQuantity: 3 } as Product;
    productRepository.findOne.mockResolvedValue(product);

    await service.updateStock('product-id', { stockQuantity: 12 });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'product-id', stockQuantity: 12 }),
    );
  });

  it('blocks deleting products that are referenced by order items', async () => {
    productRepository.findOne.mockResolvedValue({ id: 'product-id' });
    orderItemsRepository.count.mockResolvedValue(1);

    await expect(service.deleteProduct('product-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productRepository.remove).not.toHaveBeenCalled();
  });

  it('deletes products that are not referenced by order items', async () => {
    const product = { id: 'product-id' };
    productRepository.findOne.mockResolvedValue(product);
    orderItemsRepository.count.mockResolvedValue(0);

    await service.deleteProduct('product-id');

    expect(productRepository.remove).toHaveBeenCalledWith(product);
  });

  it('rejects duplicate categories case-insensitively', async () => {
    categoryRepository.createQueryBuilder.mockReturnValueOnce(
      makeQueryBuilder({ getCount: jest.fn().mockResolvedValue(1) }),
    );

    await expect(service.createCategory({ name: 'phone' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('blocks deleting categories still used by products', async () => {
    productRepository.createQueryBuilder.mockReturnValueOnce(
      makeQueryBuilder({ getCount: jest.fn().mockResolvedValue(2) }),
    );

    await expect(service.deleteCategory('Phone')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns merged distinct categories from managed categories and products', async () => {
    categoryRepository.find.mockResolvedValue([{ name: 'Camera' }, { name: 'Phone' }]);
    queryBuilder.getRawMany.mockResolvedValue([
      { category: 'phone' },
      { category: 'Laptop' },
    ]);

    await expect(service.getCategories()).resolves.toEqual([
      'Camera',
      'Laptop',
      'Phone',
    ]);
  });
});
