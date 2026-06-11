import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Invoice } from '../invoices/entities/invoice.entity';
import { OrderItemStatus } from '../orders/entities/order-item-status.enum';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsService } from '../payments/payments.service';
import { Product } from '../products/entities/product.entity';
import { CreateReturnRequestDto, ReturnRequestDto } from './dto/return-request.dto';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnStatus } from './entities/return-status.enum';

const RETURN_WINDOW_DAYS = 30;

@Injectable()
export class ReturnsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ReturnRequest)
    private readonly returnsRepository: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createForUser(
    orderId: string,
    orderItemId: string,
    userId: string,
    dto: CreateReturnRequestDto,
  ): Promise<ReturnRequestDto> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You are not allowed to return items from this order');
    }
    if (order.status !== OrderStatus.Delivered) {
      throw new BadRequestException('Returns are only allowed for delivered orders');
    }

    const daysSinceOrder =
      (Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > RETURN_WINDOW_DAYS) {
      throw new BadRequestException(
        `Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days.`,
      );
    }

    const item = order.items.find((row) => row.id === orderItemId);
    if (!item) {
      throw new NotFoundException(`Order item not found: ${orderItemId}`);
    }
    if (item.status !== OrderItemStatus.Delivered) {
      throw new BadRequestException('Only delivered items can be returned');
    }

    const existing = await this.returnsRepository.findOne({
      where: [
        { orderItem: { id: orderItemId }, status: ReturnStatus.Pending },
        { orderItem: { id: orderItemId }, status: ReturnStatus.Refunded },
      ],
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === ReturnStatus.Refunded
          ? 'This item has already been refunded'
          : 'A pending return already exists for this item',
      );
    }

    const refundAmount = Math.round(item.priceAtPurchase * item.quantity * 100) / 100;
    const saved = await this.returnsRepository.save(
      this.returnsRepository.create({
        userId,
        order,
        orderItem: item,
        quantity: item.quantity,
        refundAmount,
        reason: dto.reason?.trim() || null,
        status: ReturnStatus.Pending,
      }),
    );

    return this.toDto(saved, item);
  }

  async listForUser(userId: string): Promise<ReturnRequestDto[]> {
    const rows = await this.returnsRepository.find({
      where: { userId },
      relations: { order: true, orderItem: { product: true } },
      order: { requestedAt: 'DESC' },
    });
    return rows.map((row) => this.toDto(row, row.orderItem));
  }

  async listForStaff(status?: ReturnStatus): Promise<ReturnRequestDto[]> {
    const rows = await this.returnsRepository.find({
      where: status ? { status } : {},
      relations: { order: true, orderItem: { product: true } },
      order: { requestedAt: 'DESC' },
    });
    return rows.map((row) => this.toDto(row, row.orderItem));
  }

  async approve(returnId: string): Promise<ReturnRequestDto> {
    return this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(ReturnRequest, {
        where: { id: returnId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        throw new NotFoundException(`Return request not found: ${returnId}`);
      }
      if (locked.status !== ReturnStatus.Pending) {
        throw new BadRequestException('Only pending return requests can be approved');
      }

      const request = await manager.findOne(ReturnRequest, {
        where: { id: returnId },
        relations: { order: true, orderItem: { product: true } },
      });
      if (!request) {
        throw new NotFoundException(`Return request not found: ${returnId}`);
      }

      const product = await manager.findOne(Product, {
        where: { id: request.orderItem.product.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Product not found for return');
      }

      product.stockQuantity += request.quantity;
      await manager.save(product);

      const invoice = await manager.findOne(Invoice, {
        where: { order: { id: request.order.id } },
      });
      if (invoice) {
        this.paymentsService.refund(request.refundAmount, invoice.authorizationReference);
      }

      request.status = ReturnStatus.Refunded;
      const saved = await manager.save(request);
      return this.toDto(saved, request.orderItem);
    });
  }

  async reject(returnId: string): Promise<ReturnRequestDto> {
    const request = await this.returnsRepository.findOne({
      where: { id: returnId },
      relations: { order: true, orderItem: { product: true } },
    });
    if (!request) {
      throw new NotFoundException(`Return request not found: ${returnId}`);
    }
    if (request.status !== ReturnStatus.Pending) {
      throw new BadRequestException('Only pending return requests can be rejected');
    }
    request.status = ReturnStatus.Rejected;
    const saved = await this.returnsRepository.save(request);
    return this.toDto(saved, request.orderItem);
  }

  private toDto(request: ReturnRequest, item: OrderItem): ReturnRequestDto {
    return {
      id: request.id,
      orderId: request.order.id,
      orderItemId: item.id,
      productName: item.product?.name ?? 'Unknown product',
      quantity: request.quantity,
      refundAmount: Number(request.refundAmount),
      status: request.status,
      reason: request.reason,
      requestedAt: request.requestedAt.toISOString(),
    };
  }
}
