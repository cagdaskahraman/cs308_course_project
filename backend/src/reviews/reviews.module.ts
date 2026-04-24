import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Review } from './entities/review.entity';
import { ProductManagerGuard } from './guards/product-manager.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Product, User, OrderItem]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ProductManagerGuard, JwtAuthGuard],
  exports: [ReviewsService, TypeOrmModule],
})
export class ReviewsModule {}
