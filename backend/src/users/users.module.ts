import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Invoice } from '../invoices/entities/invoice.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersDevSeedService } from './users-dev-seed.service';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Order, OrderItem, Invoice]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersDevSeedService, JwtAuthGuard],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}

