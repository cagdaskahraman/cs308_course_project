import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { InvoicesService } from '../invoices/invoices.service';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order-status.enum';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    orderRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
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
          useValue: { findOne: jest.fn() },
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
          useValue: {
            manager: {
              save: jest.fn(),
            },
          },
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
});
