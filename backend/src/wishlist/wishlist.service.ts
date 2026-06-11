import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async listForUser(userId: string): Promise<Product[]> {
    const rows = await this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => row.product);
  }

  async add(userId: string, productId: string): Promise<Product[]> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with id '${productId}' not found`);
    }

    const existing = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existing) {
      throw new ConflictException('Product is already in the wishlist');
    }

    await this.wishlistRepository.save(
      this.wishlistRepository.create({
        user: { id: userId } as WishlistItem['user'],
        product: { id: productId } as WishlistItem['product'],
      }),
    );
    return this.listForUser(userId);
  }

  async remove(userId: string, productId: string): Promise<Product[]> {
    const row = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (!row) {
      throw new NotFoundException('Wishlist item not found');
    }
    await this.wishlistRepository.remove(row);
    return this.listForUser(userId);
  }
}
