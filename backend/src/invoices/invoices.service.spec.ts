import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from '../payments/payment-status.enum';
import { Invoice } from './entities/invoice.entity';
import { InvoiceMailerService } from './invoice-mailer.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepository: { findOne: jest.Mock };
  let pdfService: { generate: jest.Mock };
  let mailer: {
    sendInvoice: jest.Mock;
    getDispatchForInvoice: jest.Mock;
  };

  const sampleInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-000001',
    billingEmail: 'buyer@example.com',
    billingName: 'Buyer',
    taxId: 'TAX-1',
    billingAddress: 'Istanbul',
    cardLast4: '4242',
    authorizationReference: 'AUTH-1',
    subtotal: 100,
    total: 100,
    issuedAt: new Date('2026-06-01T10:00:00.000Z'),
    order: {
      id: 'order-1',
      userId: 'user-1',
      items: [
        {
          quantity: 1,
          priceAtPurchase: 100,
          product: { id: 'prod-1', name: 'Phone' },
        },
      ],
    },
  };

  beforeEach(() => {
    invoiceRepository = { findOne: jest.fn() };
    pdfService = { generate: jest.fn().mockReturnValue(Buffer.from('pdf')) };
    mailer = {
      sendInvoice: jest.fn().mockResolvedValue(undefined),
      getDispatchForInvoice: jest.fn(),
    };
    service = new InvoicesService(
      invoiceRepository as unknown as Repository<Invoice>,
      pdfService as unknown as InvoicePdfService,
      mailer as unknown as InvoiceMailerService,
    );
  });

  it('creates an invoice for an order inside a transaction', async () => {
    const manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn(async (invoice) => ({ ...invoice, id: 'inv-1' })),
    };
    const order = {
      id: 'order-1',
      totalPrice: 199.5,
      items: [],
    } as unknown as Order;

    const saved = await service.createForOrder(
      manager as unknown as EntityManager,
      order,
      {
        status: PaymentStatus.APPROVED,
        amount: 199.5,
        cardHolder: 'Buyer Name',
        cardLast4: '4242',
        authorizationReference: 'AUTH-XYZ',
        authorizedAt: new Date().toISOString(),
      },
      {
        email: 'buyer@example.com',
        name: 'Buyer Name',
        address: 'Istanbul',
        taxId: 'TAX-99',
      },
    );

    expect(saved.billingEmail).toBe('buyer@example.com');
    expect(saved.cardLast4).toBe('4242');
    expect(saved.total).toBe(199.5);
    expect(manager.save).toHaveBeenCalled();
  });

  it('maps invoice entity to dto with line items', () => {
    const dto = InvoicesService.toDto(sampleInvoice as Invoice);
    expect(dto.invoiceNumber).toBe('INV-2026-000001');
    expect(dto.billingEmail).toBe('buyer@example.com');
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0].name).toBe('Phone');
    expect(dto.total).toBe(100);
  });

  it('throws when invoice is missing for order', async () => {
    invoiceRepository.findOne.mockResolvedValue(null);
    await expect(service.getByOrderId('missing-order')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delivers invoice pdf via mailer', async () => {
    invoiceRepository.findOne.mockResolvedValue(sampleInvoice);
    const dto = await service.deliverInvoiceForOrder('order-1');
    expect(dto.orderId).toBe('order-1');
    expect(pdfService.generate).toHaveBeenCalled();
    expect(mailer.sendInvoice).toHaveBeenCalled();
  });

  it('allows staff to access any invoice order', async () => {
    invoiceRepository.findOne.mockResolvedValue(sampleInvoice);
    await expect(
      service.assertOrderAccess('order-1', {
        sub: 'other-user',
        role: 'sales_manager',
      }),
    ).resolves.toBeUndefined();
  });

  it('forbids customer access to another users invoice', async () => {
    invoiceRepository.findOne.mockResolvedValue(sampleInvoice);
    await expect(
      service.assertOrderAccess('order-1', { sub: 'other-user', role: 'customer' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns stored mail dispatch for an order', async () => {
    invoiceRepository.findOne.mockResolvedValue(sampleInvoice);
    mailer.getDispatchForInvoice.mockReturnValue({
      to: 'buyer@example.com',
      subject: 'Invoice',
      body: 'Thanks',
      attachmentName: 'INV.pdf',
      attachmentSize: 10,
    });
    const dispatch = await service.getMailDispatchByOrderId('order-1');
    expect(dispatch.to).toBe('buyer@example.com');
  });
});
