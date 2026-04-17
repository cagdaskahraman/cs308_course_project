import { InvoiceDto } from './dto/invoice.dto';
import { InvoiceMailerService } from './invoice-mailer.service';
import { InvoicePdfService } from './invoice-pdf.service';

const sampleInvoice: InvoiceDto = {
  id: '11111111-1111-1111-1111-111111111111',
  invoiceNumber: 'INV-2026-000001',
  orderId: '22222222-2222-2222-2222-222222222222',
  billingEmail: 'buyer@example.com',
  billingName: 'AYSE YILMAZ',
  cardLast4: '4242',
  authorizationReference: 'AUTH-abcdef01',
  items: [
    {
      productId: '33333333-3333-3333-3333-333333333333',
      name: 'Sample Product',
      quantity: 2,
      unitPrice: 99.9,
      lineTotal: 199.8,
    },
  ],
  subtotal: 199.8,
  total: 199.8,
  issuedAt: '2026-04-17T10:00:00.000Z',
};

describe('InvoicePdfService', () => {
  const service = new InvoicePdfService();

  it('produces a valid PDF 1.x buffer that ends with %%EOF', () => {
    const buf = service.generate(sampleInvoice);
    expect(buf.length).toBeGreaterThan(200);
    expect(buf.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buf.slice(-5).toString('latin1')).toBe('%%EOF');
  });

  it('embeds the invoice number and total into the PDF stream', () => {
    const buf = service.generate(sampleInvoice);
    const text = buf.toString('latin1');
    expect(text).toContain('INV-2026-000001');
    expect(text).toContain('199.80');
    expect(text).toContain('**** **** **** 4242');
  });
});

describe('InvoiceMailerService', () => {
  it('records a stub dispatch including the attachment size', () => {
    const mailer = new InvoiceMailerService();
    const pdf = Buffer.from('%PDF-1.4 stub');
    const payload = mailer.sendInvoice(sampleInvoice, pdf);
    expect(payload.to).toBe(sampleInvoice.billingEmail);
    expect(payload.attachmentName).toBe(`${sampleInvoice.invoiceNumber}.pdf`);
    expect(payload.attachmentSize).toBe(pdf.length);
    expect(mailer.getLastDispatch()).toEqual(payload);
  });
});
