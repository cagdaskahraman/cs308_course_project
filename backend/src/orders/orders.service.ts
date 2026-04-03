import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.enum';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
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

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: { product: true } },
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }

    const next = dto.status;
    if (!OrdersService.isValidStatusTransition(order.status, next)) {
      throw new BadRequestException(
        `Invalid status transition from '${order.status}' to '${next}'`,
      );
    }

    order.status = next;
    await this.orderRepository.save(order);

    if (next === OrderStatus.InTransit) {
      console.log(
        `[DeliveryEvent] Order ${order.id} forwarded to Delivery Department`,
      );
    }

    return this.findOne(id);
  }

  private static isValidStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): boolean {
    const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
      [OrderStatus.Processing]: [OrderStatus.InTransit, OrderStatus.Cancelled],
      [OrderStatus.InTransit]: [OrderStatus.Delivered],
      [OrderStatus.Delivered]: [],
      [OrderStatus.Cancelled]: [],
    };
    return allowed[current].includes(next);
  }
}
