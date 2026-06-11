import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

import { InvoiceDto } from './dto/invoice.dto';

export type InvoiceMailPayload = {
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  attachmentSize: number;
  messageId?: string;
  smtpResponse?: string;
  accepted?: string[];
  rejected?: string[];
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
  private readonly dispatchesByInvoiceNumber = new Map<
    string,
    InvoiceMailPayload
  >();
  private transporter: Transporter | null = null;
  private readonly senderAddress: string;
  private readonly smtpConfigured: boolean;
  private transportVerified = false;

  private static formatSmtpError(error: unknown): string {
    if (!(error instanceof Error)) return 'Unknown SMTP error';
    const message = error.message ?? 'Unknown SMTP error';
    if (message.includes('535-5.7.8') || message.includes('BadCredentials')) {
      return (
        `${message}\n` +
        'Gmail rejects regular account passwords for SMTP. ' +
        'Use a Google App Password (16 chars) in SMTP_PASS.'
      );
    }
    return message;
  }

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    this.senderAddress =
      process.env.SMTP_FROM?.trim() ??
      process.env.SMTP_USER?.trim() ??
      'no-reply@electrostore.local';

    if (host && user && pass) {
      this.smtpConfigured = true;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
      });
      this.logger.log(`[InvoiceMailer] SMTP transport configured for ${host}:${port}`);
    } else {
      this.smtpConfigured = false;
      this.logger.warn(
        '[InvoiceMailer] SMTP not configured. Falling back to stubbed dispatch logs.',
      );
    }
  }

  async sendInvoice(invoice: InvoiceDto, pdf: Buffer): Promise<InvoiceMailPayload> {
    const payload: InvoiceMailPayload = {
      to: invoice.billingEmail,
      subject: `Your ElectroStore invoice ${invoice.invoiceNumber}`,
      body:
        `Hi ${invoice.billingName},\n\n` +
        `Thanks for your purchase. Your order ${invoice.orderId} has been confirmed.\n` +
        `Delivery address: ${invoice.billingAddress}\n` +
        `Total charged: ${invoice.total.toFixed(2)}.\n` +
        `Authorization reference: ${invoice.authorizationReference}.\n\n` +
        `Your invoice is attached as a PDF.`,
      attachmentName: `${invoice.invoiceNumber}.pdf`,
      attachmentSize: pdf.length,
    };

    if (this.transporter && this.smtpConfigured) {
      try {
        if (!this.transportVerified) {
          await this.transporter.verify();
          this.transportVerified = true;
        }
        const info = await this.transporter.sendMail({
          from: this.senderAddress,
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
          attachments: [
            {
              filename: payload.attachmentName,
              content: pdf,
              contentType: 'application/pdf',
            },
          ],
        });
        this.logger.log(
          `[InvoiceMailer] SMTP sent to=${payload.to} messageId=${info.messageId}`,
        );
        payload.messageId = info.messageId;
        payload.smtpResponse = info.response;
        payload.accepted = info.accepted.map((v: string) => String(v));
        payload.rejected = info.rejected.map((v: string) => String(v));
      } catch (error: unknown) {
        const formatted = InvoiceMailerService.formatSmtpError(error);
        this.logger.error(`[InvoiceMailer] SMTP send failed: ${formatted}`);
        throw error;
      }
    } else {
      this.logger.log(
        `[InvoiceMailer] stub dispatch to=${payload.to} subject="${payload.subject}" attachment=${payload.attachmentName} (${payload.attachmentSize} bytes)`,
      );
    }
    this.lastDispatch = payload;
    this.dispatchesByInvoiceNumber.set(invoice.invoiceNumber, payload);
    return payload;
  }

  getLastDispatch(): InvoiceMailPayload | null {
    return this.lastDispatch;
  }

  getDispatchForInvoice(invoiceNumber: string): InvoiceMailPayload | null {
    return this.dispatchesByInvoiceNumber.get(invoiceNumber) ?? null;
  }

  async sendDiscountAlert(input: {
    to: string;
    productName: string;
    discountRate: number;
    newPrice: number;
  }): Promise<void> {
    const payload: InvoiceMailPayload = {
      to: input.to,
      subject: `Price drop: ${input.productName}`,
      body:
        `Good news!\n\n` +
        `${input.productName} is now ${input.discountRate}% off.\n` +
        `New price: ${input.newPrice.toFixed(2)}.\n\n` +
        `Visit ElectroStore to purchase while the offer lasts.`,
      attachmentName: '',
      attachmentSize: 0,
    };

    if (this.transporter && this.smtpConfigured) {
      try {
        if (!this.transportVerified) {
          await this.transporter.verify();
          this.transportVerified = true;
        }
        const info = await this.transporter.sendMail({
          from: this.senderAddress,
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
        });
        payload.messageId = info.messageId;
      } catch (error: unknown) {
        this.logger.warn(
          `[InvoiceMailer] discount alert failed: ${InvoiceMailerService.formatSmtpError(error)}`,
        );
      }
    } else {
      this.logger.log(
        `[InvoiceMailer] stub discount alert to=${payload.to} product="${input.productName}" rate=${input.discountRate}%`,
      );
    }
    this.lastDispatch = payload;
  }
}
