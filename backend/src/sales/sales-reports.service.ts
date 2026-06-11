import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { InvoiceDto } from '../invoices/dto/invoice.dto';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { RevenueSummaryDto } from '../pricing/dto/pricing.dto';

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  private parseRange(from: string, to: string): { start: Date; end: Date } {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    end.setHours(23, 59, 59, 999);
    if (start > end) {
      throw new BadRequestException('from must be before to');
    }
    return { start, end };
  }

  async listInvoices(from: string, to: string): Promise<InvoiceDto[]> {
    const { start, end } = this.parseRange(from, to);
    const invoices = await this.invoiceRepository.find({
      where: { issuedAt: Between(start, end) },
      relations: { order: { items: { product: true } } },
      order: { issuedAt: 'DESC' },
    });
    return invoices.map((invoice) => InvoicesService.toDto(invoice));
  }

  async getRevenueSummary(from: string, to: string): Promise<RevenueSummaryDto> {
    const { start, end } = this.parseRange(from, to);
    const invoices = await this.invoiceRepository.find({
      where: { issuedAt: Between(start, end) },
    });
    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const invoiceCount = invoices.length;
    return {
      from,
      to,
      invoiceCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue:
        invoiceCount === 0
          ? 0
          : Math.round((totalRevenue / invoiceCount) * 100) / 100,
    };
  }
}
