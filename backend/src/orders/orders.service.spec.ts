import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { InvoicesService } from '../invoices/invoices.service';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/entities/user.entity';
import { OrderItemStatus } from './entities/order-item-status.enum';
import { OrderStatus } from './entities/order-status.enum';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let usersRepository: { findOne: jest.Mock; find: jest.Mock };
  let orderRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let transactionManager: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock; manager: { save: jest.Mock } };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    orderRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    transactionManager = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    dataSource = {
      transaction: jest.fn(async (cb) => cb(transactionManager)),
      manager: { save: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: InvoicesService,
          useValue: {},
        },
        {
          provide: PaymentsService,
          useValue: {},
        },
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('lists all orders for staff sorted by date descending', async () => {
    await service.findAllForStaff();
    expect(orderRepository.find).toHaveBeenCalledWith({
      relations: { items: { product: true } },
      order: { orderDate: 'DESC' },
    });
  });

  it('maps active orders into delivery list rows', async () => {
    orderRepository.find.mockResolvedValue([
      {
        id: 'order-1',
        userId: 'cust-1',
        orderDate: new Date('2026-01-15T10:00:00.000Z'),
        deliveryAddress: 'Istanbul',
        status: OrderStatus.Processing,
        items: [
          {
            id: 'item-1',
            quantity: 2,
            priceAtPurchase: 50,
            status: OrderItemStatus.Processing,
            product: { id: 'prod-1', name: 'Phone' },
          },
        ],
      },
    ]);
    usersRepository.find.mockResolvedValue([
      {
        id: 'cust-1',
        email: 'buyer@example.com',
        fullName: 'Buyer One',
      },
    ]);

    const rows = await service.listDeliveries();

    expect(rows).toEqual([
      {
        deliveryId: 'item-1',
        customerId: 'cust-1',
        customerName: 'Buyer One',
        customerEmail: 'buyer@example.com',
        productId: 'prod-1',
        productName: 'Phone',
        quantity: 2,
        totalPrice: 100,
        deliveryAddress: 'Istanbul',
        itemStatus: OrderItemStatus.Processing,
        orderDate: new Date('2026-01-15T10:00:00.000Z'),
        completed: false,
        orderId: 'order-1',
      },
    ]);
  });

  it('updates status from processing to in-transit', async () => {
    const order = {
      id: 'order-1',
      orderDate: new Date(),
      totalPrice: 100,
      status: OrderStatus.Processing,
      userId: 'user-1',
      deliveryAddress: null,
      items: [],
    } as Order;
    orderRepository.findOne
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, status: OrderStatus.InTransit });
    orderRepository.save.mockResolvedValue({ ...order, status: OrderStatus.InTransit });

    const updated = await service.updateStatus('order-1', {
      status: OrderStatus.InTransit,
    });

    expect(updated.status).toBe(OrderStatus.InTransit);
    expect(orderRepository.save).toHaveBeenCalled();
  });

  it('rejects invalid status transition', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: 'order-1',
      orderDate: new Date(),
      totalPrice: 100,
      status: OrderStatus.Processing,
      userId: 'user-1',
      deliveryAddress: null,
      items: [],
    } as Order);

    await expect(
      service.updateStatus('order-1', {
        status: OrderStatus.Delivered,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when order is missing while updating status', async () => {
    orderRepository.findOne.mockResolvedValue(null);
    await expect(
      service.updateStatus('missing-order', {
        status: OrderStatus.InTransit,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cancels an order and restores product stock', async () => {
    const cancelledOrder = {
      id: 'order-1',
      status: OrderStatus.Cancelled,
      items: [
        {
          quantity: 2,
          product: { id: 'prod-1', name: 'Phone' },
        },
      ],
    };
    transactionManager.findOne
      .mockResolvedValueOnce({
        id: 'order-1',
        status: OrderStatus.Processing,
        items: cancelledOrder.items,
      })
      .mockResolvedValueOnce({ id: 'prod-1', stockQuantity: 3 });
    transactionManager.findOneOrFail.mockResolvedValue(cancelledOrder);

    const updated = await service.updateStatus('order-1', {
      status: OrderStatus.Cancelled,
    });

    expect(updated.status).toBe(OrderStatus.Cancelled);
    expect(transactionManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ stockQuantity: 5 }),
    );
  });
});
