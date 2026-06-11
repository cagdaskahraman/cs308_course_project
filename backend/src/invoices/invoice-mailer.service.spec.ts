import { InvoiceMailerService } from './invoice-mailer.service';

describe('InvoiceMailerService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('stub-sends invoice mail when SMTP is not configured', async () => {
    const mailer = new InvoiceMailerService();
    const payload = await mailer.sendInvoice(
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-000001',
        orderId: 'order-1',
        billingEmail: 'buyer@example.com',
        billingName: 'Buyer',
        taxId: null,
        billingAddress: 'Istanbul',
        cardLast4: '4242',
        authorizationReference: 'AUTH-1',
        items: [],
        subtotal: 50,
        total: 50,
        issuedAt: new Date().toISOString(),
      },
      Buffer.from('pdf-bytes'),
    );

    expect(payload.to).toBe('buyer@example.com');
    expect(payload.subject).toContain('INV-2026-000001');
    expect(payload.attachmentSize).toBe(9);
    expect(mailer.getLastDispatch()?.to).toBe('buyer@example.com');
    expect(mailer.getDispatchForInvoice('INV-2026-000001')?.to).toBe(
      'buyer@example.com',
    );
  });

  it('stub-sends discount alert when SMTP is not configured', async () => {
    const mailer = new InvoiceMailerService();
    await mailer.sendDiscountAlert({
      to: 'buyer@example.com',
      productName: 'Phone',
      discountRate: 15,
      newPrice: 85,
    });

    const last = mailer.getLastDispatch();
    expect(last?.to).toBe('buyer@example.com');
    expect(last?.subject).toContain('Phone');
    expect(last?.body).toContain('15%');
    expect(last?.body).toContain('85.00');
  });
});
