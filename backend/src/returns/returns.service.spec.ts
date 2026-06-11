import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { OrderItemStatus } from '../orders/entities/order-item-status.enum';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { PaymentsService } from '../payments/payments.service';
import { ReturnStatus } from './entities/return-status.enum';
import { ReturnsService } from './returns.service';

describe('ReturnsService', () => {
  let service: ReturnsService;
  let returnsRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let ordersRepository: { findOne: jest.Mock };
  let invoicesRepository: { findOne: jest.Mock };
  let paymentsService: { refund: jest.Mock };
  let transactionManager: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    returnsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (value) => ({ ...value, id: 'return-1', requestedAt: new Date() })),
      create: jest.fn((value) => value),
    };
    ordersRepository = { findOne: jest.fn() };
    invoicesRepository = { findOne: jest.fn() };
    paymentsService = { refund: jest.fn() };
    transactionManager = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    dataSource = {
      transaction: jest.fn(async (cb) => cb(transactionManager)),
    };

    service = new ReturnsService(
      dataSource as unknown as DataSource,
      returnsRepository as never,
      ordersRepository as never,
      invoicesRepository as never,
      paymentsService as unknown as PaymentsService,
    );
  });

  it('rejects return when order does not belong to user', async () => {
    ordersRepository.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'other-user',
      status: OrderStatus.Delivered,
      orderDate: new Date(),
      items: [],
    });

    await expect(
      service.createForUser('order-1', 'item-1', 'user-1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a pending return for a delivered item within 30 days', async () => {
    ordersRepository.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.Delivered,
      orderDate: new Date(),
      items: [
        {
          id: 'item-1',
          quantity: 2,
          priceAtPurchase: 50,
          status: OrderItemStatus.Delivered,
          product: { id: 'prod-1', name: 'Phone' },
        },
      ],
    });

    const result = await service.createForUser('order-1', 'item-1', 'user-1', {
      reason: 'Defective',
    });

    expect(result.status).toBe(ReturnStatus.Pending);
    expect(result.refundAmount).toBe(100);
    expect(returnsRepository.save).toHaveBeenCalled();
  });

  it('approves a return, restores stock, and issues refund', async () => {
    const pendingReturn = {
      id: 'return-1',
      status: ReturnStatus.Pending,
      quantity: 1,
      refundAmount: 75,
      requestedAt: new Date('2026-06-01T10:00:00.000Z'),
      reason: null,
      order: { id: 'order-1' },
      orderItem: {
        id: 'item-1',
        product: { id: 'prod-1', name: 'Tablet' },
      },
    };
    transactionManager.findOne
      .mockResolvedValueOnce(pendingReturn)
      .mockResolvedValueOnce(pendingReturn)
      .mockResolvedValueOnce({ id: 'prod-1', stockQuantity: 4 })
      .mockResolvedValueOnce({
        authorizationReference: 'AUTH-123',
      });

    const result = await service.approve('return-1');

    expect(result.status).toBe(ReturnStatus.Refunded);
    expect(paymentsService.refund).toHaveBeenCalledWith(75, 'AUTH-123');
    expect(transactionManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ stockQuantity: 5 }),
    );
  });

  it('refunds the discounted purchase price even after the campaign ends', async () => {
    ordersRepository.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.Delivered,
      orderDate: new Date(),
      items: [
        {
          id: 'item-1',
          quantity: 1,
          priceAtPurchase: 80,
          status: OrderItemStatus.Delivered,
          product: { id: 'prod-1', name: 'Laptop' },
        },
      ],
    });

    const result = await service.createForUser('order-1', 'item-1', 'user-1', {});

    expect(result.refundAmount).toBe(80);
  });

  it('rejects a second return after the item was refunded', async () => {
    ordersRepository.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.Delivered,
      orderDate: new Date(),
      items: [
        {
          id: 'item-1',
          quantity: 1,
          priceAtPurchase: 20,
          status: OrderItemStatus.Delivered,
          product: { id: 'prod-1', name: 'Cable' },
        },
      ],
    });
    returnsRepository.findOne.mockResolvedValue({
      id: 'return-old',
      status: ReturnStatus.Refunded,
    });

    await expect(
      service.createForUser('order-1', 'item-1', 'user-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects return requests outside the 30-day window', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    ordersRepository.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.Delivered,
      orderDate: oldDate,
      items: [
        {
          id: 'item-1',
          quantity: 1,
          priceAtPurchase: 20,
          status: OrderItemStatus.Delivered,
          product: { id: 'prod-1', name: 'Cable' },
        },
      ],
    });

    await expect(
      service.createForUser('order-1', 'item-1', 'user-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
