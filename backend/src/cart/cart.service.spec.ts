import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { Cart } from './entities/cart.entity';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let transactionManager: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    cartRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (cart) => ({ ...cart, id: 'cart-1' })),
      create: jest.fn((data) => data),
    };
    transactionManager = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((_entity, data) => data),
    };
    dataSource = {
      transaction: jest.fn(async (cb) => cb(transactionManager)),
    };
    service = new CartService(
      dataSource as unknown as DataSource,
      cartRepository as unknown as Repository<Cart>,
    );
  });

  it('creates an empty cart', async () => {
    const cart = await service.create();
    expect(cartRepository.save).toHaveBeenCalled();
  });

  it('throws when adding to a missing cart', async () => {
    transactionManager.findOne.mockResolvedValueOnce(null);
    await expect(
      service.addItem({ cartId: 'missing', productId: 'prod-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unpriced products', async () => {
    transactionManager.findOne
      .mockResolvedValueOnce({ id: 'cart-1', items: [] })
      .mockResolvedValueOnce({
        id: 'prod-1',
        name: 'Phone',
        price: 0,
        stockQuantity: 5,
      } as Product);

    await expect(
      service.addItem({ cartId: 'cart-1', productId: 'prod-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects quantities above available stock', async () => {
    transactionManager.findOne
      .mockResolvedValueOnce({ id: 'cart-1', items: [] })
      .mockResolvedValueOnce({
        id: 'prod-1',
        name: 'Phone',
        price: 100,
        stockQuantity: 2,
      } as Product);

    await expect(
      service.addItem({ cartId: 'cart-1', productId: 'prod-1', quantity: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds a new item to the cart', async () => {
    const refreshedCart = {
      id: 'cart-1',
      items: [{ id: 'item-1', quantity: 1, product: { id: 'prod-1', price: 100 } }],
    };
    transactionManager.findOne
      .mockResolvedValueOnce({ id: 'cart-1', items: [] })
      .mockResolvedValueOnce({
        id: 'prod-1',
        name: 'Phone',
        price: 100,
        stockQuantity: 5,
      } as Product);
    transactionManager.findOneOrFail.mockResolvedValueOnce(refreshedCart);

    const cart = await service.addItem({
      cartId: 'cart-1',
      productId: 'prod-1',
      quantity: 1,
    });

    expect(cart.items).toHaveLength(1);
    expect(transactionManager.save).toHaveBeenCalled();
  });

  it('returns cart total from findOne', async () => {
    cartRepository.findOne.mockResolvedValue({
      id: 'cart-1',
      items: [
        { quantity: 2, product: { price: 50 } },
        { quantity: 1, product: { price: 30 } },
      ],
    });

    const result = await service.findOne('cart-1');
    expect(result.totalPrice).toBe(130);
  });
});
