import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { InvoiceDto } from '../invoices/dto/invoice.dto';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { RevenueChartPointDto, RevenueSummaryDto } from '../pricing/dto/pricing.dto';

const DEFAULT_COST_RATE = 0.65;

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  private costRate(): number {
    const raw = Number(process.env.PRODUCT_COST_RATE ?? DEFAULT_COST_RATE);
    if (!Number.isFinite(raw) || raw <= 0 || raw >= 1) {
      return DEFAULT_COST_RATE;
    }
    return raw;
  }

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

  private estimateLineCost(quantity: number, listPrice: number): number {
    return quantity * listPrice * this.costRate();
  }

  private summarizeInvoice(invoice: Invoice): { revenue: number; cost: number } {
    const revenue = Number(invoice.total);
    const cost = (invoice.order?.items ?? []).reduce((sum, item) => {
      const listPrice = Number(item.product?.listPrice ?? item.priceAtPurchase);
      return sum + this.estimateLineCost(item.quantity, listPrice);
    }, 0);
    return { revenue, cost };
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
      relations: { order: { items: { product: true } } },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    for (const invoice of invoices) {
      const { revenue, cost } = this.summarizeInvoice(invoice);
      totalRevenue += revenue;
      totalCost += cost;
    }

    const invoiceCount = invoices.length;
    const totalProfit = totalRevenue - totalCost;
    return {
      from,
      to,
      invoiceCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(Math.max(totalProfit, 0) * 100) / 100,
      totalLoss: Math.round(Math.max(-totalProfit, 0) * 100) / 100,
      averageOrderValue:
        invoiceCount === 0
          ? 0
          : Math.round((totalRevenue / invoiceCount) * 100) / 100,
    };
  }

  async getRevenueChart(from: string, to: string): Promise<RevenueChartPointDto[]> {
    const { start, end } = this.parseRange(from, to);
    const invoices = await this.invoiceRepository.find({
      where: { issuedAt: Between(start, end) },
      relations: { order: { items: { product: true } } },
      order: { issuedAt: 'ASC' },
    });

    const buckets = new Map<string, { revenue: number; cost: number }>();
    for (const invoice of invoices) {
      const day = invoice.issuedAt.toISOString().slice(0, 10);
      const { revenue, cost } = this.summarizeInvoice(invoice);
      const current = buckets.get(day) ?? { revenue: 0, cost: 0 };
      buckets.set(day, {
        revenue: current.revenue + revenue,
        cost: current.cost + cost,
      });
    }

    return Array.from(buckets.entries()).map(([date, totals]) => {
      const profit = totals.revenue - totals.cost;
      return {
        date,
        revenue: Math.round(totals.revenue * 100) / 100,
        cost: Math.round(totals.cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
      };
    });
  }
}
