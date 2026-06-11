import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    create: jest.Mock;
  };
  let productsRepository: { findOne: jest.Mock };

  beforeEach(() => {
    wishlistRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn((value) => value),
    };
    productsRepository = {
      findOne: jest.fn(),
    };
    service = new WishlistService(
      wishlistRepository as unknown as Repository<WishlistItem>,
      productsRepository as unknown as Repository<Product>,
    );
  });

  it('adds a product to the wishlist', async () => {
    productsRepository.findOne.mockResolvedValue({ id: 'p1' });
    wishlistRepository.findOne.mockResolvedValue(null);
    wishlistRepository.find.mockResolvedValue([
      { product: { id: 'p1', name: 'Phone' } },
    ]);

    const items = await service.add('user-1', 'p1');

    expect(items).toHaveLength(1);
    expect(wishlistRepository.save).toHaveBeenCalled();
  });

  it('rejects duplicate wishlist entries', async () => {
    productsRepository.findOne.mockResolvedValue({ id: 'p1' });
    wishlistRepository.findOne.mockResolvedValue({ id: 'w1' });

    await expect(service.add('user-1', 'p1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('removes a wishlist item', async () => {
    wishlistRepository.findOne.mockResolvedValue({ id: 'w1' });
    wishlistRepository.find.mockResolvedValue([]);

    await service.remove('user-1', 'p1');

    expect(wishlistRepository.remove).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('throws when removing a missing wishlist item', async () => {
    wishlistRepository.findOne.mockResolvedValue(null);

    await expect(service.remove('user-1', 'p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
