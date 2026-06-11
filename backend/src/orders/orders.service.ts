import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentResultDto } from '../payments/dto/payment-result.dto';
import { PaymentsService } from '../payments/payments.service';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { DeliveryListItemDto } from './dto/delivery-list-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemStatus } from './entities/order-item-status.enum';
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async checkout(
    dto: CheckoutDto,
    actor: { sub: string; email?: string; role?: string },
  ): Promise<Order> {
    const actorUser = await this.usersRepository.findOne({
      where: { id: actor.sub },
      select: ['id', 'email', 'fullName', 'taxId', 'homeAddress'],
    });
    const billingEmail =
      dto.billingEmail ??
      actorUser?.email ??
      actor?.email ??
      'anonymous@electrostore.local';
    const billingName = actorUser?.fullName?.trim() || dto.payment.cardHolder;
    const deliveryAddress =
      dto.deliveryAddress?.trim() || actorUser?.homeAddress?.trim() || 'N/A';
    const taxId = actorUser?.taxId?.trim() || null;

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
            status: OrderItemStatus.Processing,
            product,
          }),
        );
      }

      const payment: PaymentResultDto = this.paymentsService.authorize(
        totalPrice,
        dto.payment,
      );

      const order = manager.create(Order, {
        totalPrice,
        status: OrderStatus.Processing,
        userId: actor.sub,
        deliveryAddress,
        items: orderItems,
      });

      const persistedOrder = await manager.save(order);

      const fullOrder = await manager.findOneOrFail(Order, {
        where: { id: persistedOrder.id },
        relations: { items: { product: true } },
      });
      await this.invoicesService.createForOrder(
        manager,
        fullOrder,
        payment,
        {
          email: billingEmail,
          name: billingName,
          address: deliveryAddress,
          taxId,
        },
      );

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

    try {
      await this.invoicesService.deliverInvoiceForOrder(saved.id);
    } catch (err) {
      this.logger.error(
        `[Orders] Invoice dispatch failed for order ${saved.id}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Order was created but invoice email could not be sent. Please verify SMTP settings and try again.',
      );
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

  async findForCurrentUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: { items: { product: true } },
      order: { orderDate: 'DESC' },
    });
  }

  async findAllForStaff(): Promise<
    Array<
      Order & {
        customer: { id: string; email: string; fullName: string | null } | null;
      }
    >
  > {
    const orders = await this.orderRepository.find({
      relations: { items: { product: true } },
      order: { orderDate: 'DESC' },
    });
    const userIds = [
      ...new Set(
        orders
          .map((order) => order.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const users =
      userIds.length > 0
        ? await this.usersRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'email', 'fullName'],
          })
        : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return orders.map((order) => ({
      ...order,
      customer: order.userId
        ? (userMap.get(order.userId) ?? {
            id: order.userId,
            email: 'Unknown customer',
            fullName: null,
          })
        : null,
    }));
  }

  async listDeliveries(): Promise<DeliveryListItemDto[]> {
    const orders = await this.orderRepository.find({
      where: [
        { status: OrderStatus.Processing },
        { status: OrderStatus.InTransit },
        { status: OrderStatus.Delivered },
      ],
      relations: { items: { product: true } },
      order: { orderDate: 'DESC' },
    });
    const userIds = [
      ...new Set(
        orders
          .map((order) => order.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const users =
      userIds.length > 0
        ? await this.usersRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'email', 'fullName'],
          })
        : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return orders.flatMap((order) => {
      const customer = order.userId ? userMap.get(order.userId) : null;
      return order.items.map((item) => ({
        deliveryId: item.id,
        customerId: order.userId ?? 'unknown',
        customerName: customer?.fullName?.trim() || customer?.email || 'Guest',
        customerEmail: customer?.email ?? '—',
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        totalPrice:
          Math.round(item.quantity * Number(item.priceAtPurchase) * 100) /
          100,
        deliveryAddress: order.deliveryAddress ?? '—',
        itemStatus: item.status,
        orderDate: order.orderDate,
        completed: item.status === OrderItemStatus.Delivered,
        orderId: order.id,
      }));
    });
  }

  async findOneForUser(
    id: string,
    actor: { sub: string; role?: string },
  ): Promise<Order> {
    const order = await this.findOne(id);
    const isStaff =
      actor.role === 'product_manager';
    if (!isStaff && order.userId !== actor.sub) {
      throw new ForbiddenException('You are not allowed to access this order');
    }
    return order;
  }

  async cancelForUser(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: ['id', 'userId', 'status'],
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You are not allowed to cancel this order');
    }
    return this.updateStatus(orderId, { status: OrderStatus.Cancelled });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const next = dto.status;

    if (next === OrderStatus.Cancelled) {
      return this.dataSource.transaction(async (manager) => {
        // Lock the order row alone — LEFT JOINed relations are
        // incompatible with FOR UPDATE in PostgreSQL.
        const locked = await manager.findOne(Order, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) {
          throw new NotFoundException(`Order not found: ${id}`);
        }
        if (!OrdersService.isValidStatusTransition(locked.status, next)) {
          throw new BadRequestException(
            `Invalid status transition from '${locked.status}' to '${next}'`,
          );
        }

        const order = await manager.findOneOrFail(Order, {
          where: { id },
          relations: { items: { product: true } },
        });

        for (const item of order.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.product.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (product) {
            product.stockQuantity += item.quantity;
            await manager.save(product);
          }
        }

        order.status = OrderStatus.Cancelled;
        await manager.save(order);
        return manager.findOneOrFail(Order, {
          where: { id },
          relations: { items: { product: true } },
        });
      });
    }

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }

    if (!OrdersService.isValidStatusTransition(order.status, next)) {
      throw new BadRequestException(
        `Invalid status transition from '${order.status}' to '${next}'`,
      );
    }

    order.status = next;
    await this.orderRepository.save(order);

    if (next === OrderStatus.InTransit || next === OrderStatus.Delivered) {
      const mappedItemStatus =
        next === OrderStatus.InTransit
          ? OrderItemStatus.InTransit
          : OrderItemStatus.Delivered;
      for (const item of order.items) {
        if (item.status !== mappedItemStatus) {
          item.status = mappedItemStatus;
          await this.dataSource.manager.save(OrderItem, item);
        }
      }
    }

    if (next === OrderStatus.InTransit) {
      this.logger.log(
        `[DeliveryEvent] Order ${order.id} forwarded to Delivery Department`,
      );
    }

    return this.findOne(id);
  }

  async updateItemStatus(
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    const item = order.items.find((it) => it.id === itemId);
    if (!item) {
      throw new NotFoundException(`Order item not found: ${itemId}`);
    }

    if (!OrdersService.isValidOrderItemTransition(item.status, dto.status)) {
      throw new BadRequestException(
        `Invalid item status transition from '${item.status}' to '${dto.status}'`,
      );
    }

    item.status = dto.status;
    await this.dataSource.manager.save(OrderItem, item);

    const nextOrderStatus = OrdersService.deriveOrderStatusFromItems(order.items);
    if (order.status !== nextOrderStatus) {
      order.status = nextOrderStatus;
      await this.orderRepository.save(order);
    }

    return this.findOne(orderId);
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

  private static isValidOrderItemTransition(
    current: OrderItemStatus,
    next: OrderItemStatus,
  ): boolean {
    const allowed: Record<OrderItemStatus, readonly OrderItemStatus[]> = {
      [OrderItemStatus.Processing]: [OrderItemStatus.InTransit],
      [OrderItemStatus.InTransit]: [OrderItemStatus.Delivered],
      [OrderItemStatus.Delivered]: [],
    };
    return allowed[current].includes(next);
  }

  private static deriveOrderStatusFromItems(items: OrderItem[]): OrderStatus {
    if (items.length === 0) return OrderStatus.Processing;
    if (items.every((i) => i.status === OrderItemStatus.Delivered)) {
      return OrderStatus.Delivered;
    }
    if (items.some((i) => i.status === OrderItemStatus.InTransit)) {
      return OrderStatus.InTransit;
    }
    return OrderStatus.Processing;
  }
}
