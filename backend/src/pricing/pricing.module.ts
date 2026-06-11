import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { SalesManagerRoleGuard } from '../common/auth/sales-manager-role.guard';
import { InvoicesModule } from '../invoices/invoices.module';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { AdminPricingController } from './admin-pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, WishlistItem, User]),
    InvoicesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AdminPricingController],
  providers: [PricingService, JwtAuthGuard, SalesManagerRoleGuard],
  exports: [PricingService],
})
export class PricingModule {}
