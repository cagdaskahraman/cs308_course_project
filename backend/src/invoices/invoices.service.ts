import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { EntityManager, Repository } from 'typeorm';

import { PaymentResultDto } from '../payments/dto/payment-result.dto';
import { Order } from '../orders/entities/order.entity';
import { InvoiceDto, InvoiceLineItemDto } from './dto/invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { InvoiceMailerService } from './invoice-mailer.service';
import { InvoicePdfService } from './invoice-pdf.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly storageRoot = path.resolve(
    process.env.INVOICE_STORAGE_DIR ?? 'storage/invoices',
  );

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly pdfService: InvoicePdfService,
    private readonly mailer: InvoiceMailerService,
  ) {}

  /**
   * Persists an invoice for a freshly created order inside the same checkout
   * transaction. PDF rendering + mail dispatch run after the transaction
   * commits so a failure in side-effects never rolls back the order.
   */
  async createForOrder(
    manager: EntityManager,
    order: Order,
    payment: PaymentResultDto,
    billingEmail: string,
  ): Promise<Invoice> {
    const invoiceNumber = InvoicesService.formatInvoiceNumber(new Date());

    const invoice = manager.create(Invoice, {
      invoiceNumber,
      billingEmail,
      billingName: payment.cardHolder,
      cardLast4: payment.cardLast4,
      authorizationReference: payment.authorizationReference,
      subtotal: order.totalPrice,
      total: order.totalPrice,
      order,
    });

    return manager.save(invoice);
  }

  async deliverInvoiceForOrder(orderId: string): Promise<InvoiceDto> {
    const dto = await this.getByOrderId(orderId);
    const pdf = this.pdfService.generate(dto);
    this.writePdfToDisk(dto.invoiceNumber, pdf);
    this.mailer.sendInvoice(dto, pdf);
    return dto;
  }

  async getByOrderId(orderId: string): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { order: { id: orderId } },
      relations: { order: { items: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found for order ${orderId}`);
    }
    return InvoicesService.toDto(invoice);
  }

  async getById(id: string): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: { order: { items: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found: ${id}`);
    }
    return InvoicesService.toDto(invoice);
  }

  async renderPdfByOrderId(orderId: string): Promise<{ dto: InvoiceDto; pdf: Buffer }> {
    const dto = await this.getByOrderId(orderId);
    return { dto, pdf: this.pdfService.generate(dto) };
  }

  async assertOrderAccess(
    orderId: string,
    actor: { sub: string; role?: string },
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { order: { id: orderId } },
      relations: { order: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found for order ${orderId}`);
    }
    const isStaff =
      actor.role === 'product_manager' || actor.role === 'admin';
    if (!isStaff && invoice.order.userId !== actor.sub) {
      throw new ForbiddenException('You are not allowed to access this invoice');
    }
  }

  async assertInvoiceAccess(
    invoiceId: string,
    actor: { sub: string; role?: string },
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: { order: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found: ${invoiceId}`);
    }
    const isStaff =
      actor.role === 'product_manager' || actor.role === 'admin';
    if (!isStaff && invoice.order.userId !== actor.sub) {
      throw new ForbiddenException('You are not allowed to access this invoice');
    }
  }

  private writePdfToDisk(invoiceNumber: string, pdf: Buffer): void {
    try {
      fs.mkdirSync(this.storageRoot, { recursive: true });
      const filePath = path.join(this.storageRoot, `${invoiceNumber}.pdf`);
      fs.writeFileSync(filePath, pdf);
      this.logger.log(`[Invoice] PDF stored at ${filePath}`);
    } catch (err) {
      this.logger.warn(
        `[Invoice] Could not persist PDF for ${invoiceNumber}: ${(err as Error).message}`,
      );
    }
  }

  private static formatInvoiceNumber(at: Date): string {
    const y = at.getUTCFullYear();
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `INV-${y}-${rand}`;
  }

  private static toDto(invoice: Invoice): InvoiceDto {
    const items: InvoiceLineItemDto[] = (invoice.order.items ?? []).map((it) => ({
      productId: it.product?.id,
      name: it.product?.name ?? 'Unknown product',
      quantity: it.quantity,
      unitPrice: Number(it.priceAtPurchase),
      lineTotal: Number(it.priceAtPurchase) * it.quantity,
    }));
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.order.id,
      billingEmail: invoice.billingEmail,
      billingName: invoice.billingName,
      cardLast4: invoice.cardLast4,
      authorizationReference: invoice.authorizationReference,
      items,
      subtotal: Number(invoice.subtotal),
      total: Number(invoice.total),
      issuedAt: invoice.issuedAt.toISOString(),
    };
  }
}
