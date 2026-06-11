import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { SalesManagerRoleGuard } from '../common/auth/sales-manager-role.guard';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsModule } from '../payments/payments.module';
import { AdminReturnsController } from './admin-returns.controller';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest, Order, Invoice]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
    PaymentsModule,
  ],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService, JwtAuthGuard, SalesManagerRoleGuard],
})
export class ReturnsModule {}
