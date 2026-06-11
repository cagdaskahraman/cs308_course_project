import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { SalesManagerRoleGuard } from '../common/auth/sales-manager-role.guard';
import { InvoiceDto } from '../invoices/dto/invoice.dto';
import { RevenueSummaryDto } from '../pricing/dto/pricing.dto';
import { SalesReportsService } from './sales-reports.service';

@ApiTags('admin sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SalesManagerRoleGuard)
@Controller('admin/sales')
export class AdminSalesController {
  constructor(private readonly salesReportsService: SalesReportsService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices in a date range' })
  @ApiOkResponse({ type: [InvoiceDto] })
  listInvoices(
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<InvoiceDto[]> {
    return this.salesReportsService.listInvoices(from, to);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Summarize revenue for a date range' })
  @ApiOkResponse({ type: RevenueSummaryDto })
  getRevenue(
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<RevenueSummaryDto> {
    return this.salesReportsService.getRevenueSummary(from, to);
  }
}
