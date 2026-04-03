import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

// Cart service
@Injectable()
export class CartService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  // Add item to cart
  async addItem(dto: AddCartItemDto): Promise<Cart> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { id: dto.cartId },
        relations: { items: { product: true } },
      });
      if (!cart) {
        throw new NotFoundException(`Cart not found: ${dto.cartId}`);
      }

      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product not found: ${dto.productId}`);
      }

      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${dto.productId}`,
        );
      }

      // Update quantity if product already exists in cart
      const existingItem = cart.items.find(
        (item) => item.product.id === dto.productId,
      );

      if (existingItem) {
        existingItem.quantity += dto.quantity;
        await manager.save(CartItem, existingItem);
      } else {
        const cartItem = manager.create(CartItem, {
          quantity: dto.quantity,
          cart,
          product,
        });
        await manager.save(CartItem, cartItem);
      }

      return manager.findOneOrFail(Cart, {
        where: { id: dto.cartId },
        relations: { items: { product: true } },
      });
    });
  }

  // Get cart with items and totals
  async findOne(id: string): Promise<{ cart: Cart; totalPrice: number }> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: { items: { product: true } },
    });
    if (!cart) {
      throw new NotFoundException(`Cart not found: ${id}`);
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );

    return { cart, totalPrice };
  }
}
