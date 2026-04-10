import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
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

  // Stock validation
  private validateStock(
    product: Product,
    requestedQuantity: number,
  ): void {
    if (product.stockQuantity < requestedQuantity) {
      throw new BadRequestException({
        error: 'INSUFFICIENT_STOCK',
        productId: product.id,
        productName: product.name,
        requestedQuantity,
        availableStock: product.stockQuantity,
        message: `Insufficient stock for "${product.name}". Requested: ${requestedQuantity}, available: ${product.stockQuantity}.`,
      });
    }
  }

  async create(): Promise<Cart> {
    const cart = this.cartRepository.create();
    return this.cartRepository.save(cart);
  }

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

      // Check total quantity including existing cart item
      const existingItem = cart.items.find(
        (item) => item.product.id === dto.productId,
      );
      const totalQuantity = (existingItem?.quantity ?? 0) + dto.quantity;
      this.validateStock(product, totalQuantity);

      if (existingItem) {
        existingItem.quantity = totalQuantity;
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

  // Update cart item quantity
  async updateItem(
    cartId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { id: cartId },
        relations: { items: { product: true } },
      });
      if (!cart) {
        throw new NotFoundException(`Cart not found: ${cartId}`);
      }

      const cartItem = cart.items.find((item) => item.id === itemId);
      if (!cartItem) {
        throw new NotFoundException(`Cart item not found: ${itemId}`);
      }

      this.validateStock(cartItem.product, dto.quantity);

      cartItem.quantity = dto.quantity;
      await manager.save(CartItem, cartItem);

      return manager.findOneOrFail(Cart, {
        where: { id: cartId },
        relations: { items: { product: true } },
      });
    });
  }

  async removeItem(
    cartId: string,
    itemId: string,
  ): Promise<{ cart: Cart; totalPrice: number }> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { id: cartId },
        relations: { items: { product: true } },
      });
      if (!cart) {
        throw new NotFoundException(`Cart not found: ${cartId}`);
      }

      const cartItem = cart.items.find((item) => item.id === itemId);
      if (!cartItem) {
        throw new NotFoundException(`Cart item not found: ${itemId}`);
      }

      await manager.remove(CartItem, cartItem);

      const refreshed = await manager.findOneOrFail(Cart, {
        where: { id: cartId },
        relations: { items: { product: true } },
      });

      const totalPrice = refreshed.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0,
      );

      return { cart: refreshed, totalPrice };
    });
  }

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
