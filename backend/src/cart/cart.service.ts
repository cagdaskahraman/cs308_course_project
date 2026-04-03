import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

// Cart service
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Add item to cart
  async addItem(dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: dto.cartId },
      relations: { items: { product: true } },
    });
    if (!cart) {
      throw new NotFoundException(`Cart not found: ${dto.cartId}`);
    }

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found: ${dto.productId}`);
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        quantity: dto.quantity,
        cart,
        product,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.cartRepository.findOneOrFail({
      where: { id: dto.cartId },
      relations: { items: { product: true } },
    });
  }
}
