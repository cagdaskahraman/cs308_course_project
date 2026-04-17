import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentResultDto } from '../payments/dto/payment-result.dto';
import { PaymentsService } from '../payments/payments.service';
import { Product } from '../products/entities/product.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.enum';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async checkout(
    dto: CheckoutDto,
    actor?: { email?: string },
  ): Promise<Order> {
    const billingEmail = dto.billingEmail ?? actor?.email ?? 'anonymous@electrostore.local';

    const saved = await this.dataSource.transaction(async (manager) => {
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

      let payment: PaymentResultDto | null = null;
      if (dto.payment) {
        payment = this.paymentsService.authorize(totalPrice, dto.payment);
      }

      const order = manager.create(Order, {
        totalPrice,
        status: OrderStatus.Processing,
        items: orderItems,
      });

      const persistedOrder = await manager.save(order);

      if (payment) {
        const fullOrder = await manager.findOneOrFail(Order, {
          where: { id: persistedOrder.id },
          relations: { items: { product: true } },
        });
        await this.invoicesService.createForOrder(
          manager,
          fullOrder,
          payment,
          billingEmail,
        );
      }

      if (dto.cartId) {
        const cart = await manager.findOne(Cart, {
          where: { id: dto.cartId },
          relations: { items: true },
        });
        if (cart && cart.items.length > 0) {
          await manager.remove(CartItem, cart.items);
        }
      }

      return manager.findOneOrFail(Order, {
        where: { id: persistedOrder.id },
        relations: { items: { product: true } },
      });
    });

    if (dto.payment) {
      try {
        await this.invoicesService.deliverInvoiceForOrder(saved.id);
      } catch (err) {
        this.logger.warn(
          `[Orders] Invoice dispatch failed for order ${saved.id}: ${(err as Error).message}`,
        );
      }
    }

    return saved;
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
      this.logger.log(
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
