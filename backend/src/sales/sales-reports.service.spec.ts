import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { SalesReportsService } from './sales-reports.service';

describe('SalesReportsService', () => {
  let service: SalesReportsService;
  let invoiceRepository: { find: jest.Mock };

  beforeEach(() => {
    invoiceRepository = {
      find: jest.fn().mockResolvedValue([
        { total: 100, issuedAt: new Date('2026-05-01') },
        { total: 50, issuedAt: new Date('2026-05-02') },
      ]),
    };
    service = new SalesReportsService(
      invoiceRepository as unknown as Repository<Invoice>,
    );
  });

  it('rejects invalid date ranges', async () => {
    await expect(
      service.getRevenueSummary('bad-date', '2026-05-10'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('summarizes revenue for a valid date range', async () => {
    const summary = await service.getRevenueSummary('2026-05-01', '2026-05-31');

    expect(summary.invoiceCount).toBe(2);
    expect(summary.totalRevenue).toBe(150);
    expect(summary.averageOrderValue).toBe(75);
  });

  it('maps invoices to dto objects in a date range', async () => {
    invoiceRepository.find.mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-000001',
        billingEmail: 'buyer@example.com',
        billingName: 'Buyer',
        taxId: null,
        billingAddress: 'Istanbul',
        cardLast4: '4242',
        authorizationReference: 'AUTH-1',
        subtotal: 100,
        total: 100,
        issuedAt: new Date('2026-05-01T10:00:00.000Z'),
        order: { id: 'order-1', items: [] },
      },
    ]);

    const invoices = await service.listInvoices('2026-05-01', '2026-05-31');

    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoiceNumber).toBe('INV-2026-000001');
    expect(invoices[0].orderId).toBe('order-1');
  });
});
