import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { StaffRoleGuard } from '../common/auth/staff-role.guard';
import { OrderItem } from '../orders/entities/order-item.entity';
import { AdminProductsController } from './admin-products.controller';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { ProductsDevSeedService } from './products-dev-seed.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategory, OrderItem]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, ProductsDevSeedService, JwtAuthGuard, StaffRoleGuard],
  exports: [ProductsService],
})
export class ProductsModule {}

