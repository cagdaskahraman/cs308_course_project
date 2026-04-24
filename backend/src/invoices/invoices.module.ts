import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Invoice } from './entities/invoice.entity';
import { InvoiceMailerService } from './invoice-mailer.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService, InvoiceMailerService, JwtAuthGuard],
  exports: [InvoicesService, InvoicePdfService, InvoiceMailerService],
})
export class InvoicesModule {}
