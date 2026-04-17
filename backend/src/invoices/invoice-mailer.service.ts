import { Injectable, Logger } from '@nestjs/common';

import { InvoiceDto } from './dto/invoice.dto';

export type InvoiceMailPayload = {
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  attachmentSize: number;
};

/**
 * Stubbed mail delivery. In production this would hand the PDF to an SMTP /
 * transactional provider. For the demo we log the payload and expose the last
 * dispatch so e2e tests can assert delivery without an external dependency.
 */
@Injectable()
export class InvoiceMailerService {
  private readonly logger = new Logger(InvoiceMailerService.name);
  private lastDispatch: InvoiceMailPayload | null = null;

  sendInvoice(invoice: InvoiceDto, pdf: Buffer): InvoiceMailPayload {
    const payload: InvoiceMailPayload = {
      to: invoice.billingEmail,
      subject: `Your ElectroStore invoice ${invoice.invoiceNumber}`,
      body:
        `Hi ${invoice.billingName},\n\n` +
        `Thanks for your purchase. Your order ${invoice.orderId} has been confirmed.\n` +
        `Total charged: ${invoice.total.toFixed(2)}.\n` +
        `Authorization reference: ${invoice.authorizationReference}.\n\n` +
        `Your invoice is attached as a PDF.`,
      attachmentName: `${invoice.invoiceNumber}.pdf`,
      attachmentSize: pdf.length,
    };

    this.logger.log(
      `[InvoiceMailer] stub dispatch to=${payload.to} subject="${payload.subject}" attachment=${payload.attachmentName} (${payload.attachmentSize} bytes)`,
    );
    this.lastDispatch = payload;
    return payload;
  }

  getLastDispatch(): InvoiceMailPayload | null {
    return this.lastDispatch;
  }
}
