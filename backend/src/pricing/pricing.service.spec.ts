import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { InvoiceMailerService } from '../invoices/invoice-mailer.service';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;
  let productsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let wishlistRepository: { find: jest.Mock };
  let usersRepository: Repository<User>;
  let mailer: { sendDiscountAlert: jest.Mock };

  beforeEach(() => {
    productsRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(async (product: Product) => product),
    };
    wishlistRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    usersRepository = {} as Repository<User>;
    mailer = { sendDiscountAlert: jest.fn().mockResolvedValue(undefined) };

    service = new PricingService(
      productsRepository as unknown as Repository<Product>,
      wishlistRepository as unknown as Repository<WishlistItem>,
      usersRepository,
      mailer as unknown as InvoiceMailerService,
    );
  });

  it('computes effective price from list price and discount rate', () => {
    expect(PricingService.computeEffectivePrice(100, 10)).toBe(90);
    expect(PricingService.computeEffectivePrice(250, 0)).toBe(250);
    expect(PricingService.computeEffectivePrice(250, 100)).toBe(0);
  });

  it('updates list price and discount for a product', async () => {
    const product = {
      id: 'p1',
      listPrice: 100,
      discountRate: 0,
      price: 100,
    } as Product;
    productsRepository.findOne.mockResolvedValue(product);

    const updated = await service.updateProductPricing('p1', {
      listPrice: 200,
      discountRate: 25,
    });

    expect(updated.listPrice).toBe(200);
    expect(updated.discountRate).toBe(25);
    expect(updated.price).toBe(150);
    expect(productsRepository.save).toHaveBeenCalled();
  });

  it('throws when pricing target product is missing', async () => {
    productsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateProductPricing('missing', { listPrice: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies discount to selected products and notifies wishlist users', async () => {
    const products = [
      { id: 'p1', name: 'Phone', listPrice: 100, discountRate: 0, price: 100 },
      { id: 'p2', name: 'Laptop', listPrice: 0, discountRate: 0, price: 0 },
    ] as Product[];
    productsRepository.find.mockResolvedValue(products);
    wishlistRepository.find.mockResolvedValue([
      {
        user: { email: 'buyer@example.com' },
        product: { id: 'p1', name: 'Phone' },
      },
    ]);

    const updated = await service.applyDiscount({
      productIds: ['p1', 'p2'],
      discountRate: 20,
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].price).toBe(80);
    expect(mailer.sendDiscountAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        discountRate: 20,
        newPrice: 80,
      }),
    );
  });
});
