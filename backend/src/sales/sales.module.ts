import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { SalesManagerRoleGuard } from '../common/auth/sales-manager-role.guard';
import { InvoicesModule } from '../invoices/invoices.module';
import { Invoice } from '../invoices/entities/invoice.entity';
import { AdminSalesController } from './admin-sales.controller';
import { SalesReportsService } from './sales-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    InvoicesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AdminSalesController],
  providers: [SalesReportsService, JwtAuthGuard, SalesManagerRoleGuard],
})
export class SalesModule {}
