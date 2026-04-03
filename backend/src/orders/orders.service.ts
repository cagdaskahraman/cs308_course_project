import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.enum';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async checkout(dto: CheckoutDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const line of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: line.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product not found: ${line.productId}`);
        }

        if (product.stockQuantity < line.quantity) {
          throw new BadRequestException('Insufficient stock for product');
        }

        product.stockQuantity -= line.quantity;
        await manager.save(product);

        const lineTotal = line.quantity * product.price;
        totalPrice += lineTotal;

        orderItems.push(
          manager.create(OrderItem, {
            quantity: line.quantity,
            priceAtPurchase: product.price,
            product,
          }),
        );
      }

      const order = manager.create(Order, {
        totalPrice,
        status: OrderStatus.Processing,
        items: orderItems,
      });

      const saved = await manager.save(order);

      return manager.findOneOrFail(Order, {
        where: { id: saved.id },
        relations: { items: { product: true } },
      });
    });
  }
}
