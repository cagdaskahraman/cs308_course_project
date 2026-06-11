import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { getTypeOrmModuleOptions } from './config/database.config';
import { InvoicesModule } from './invoices/invoices.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { ReturnsModule } from './returns/returns.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmModuleOptions()),
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    UsersModule,
    ReviewsModule,
    PaymentsModule,
    InvoicesModule,
    PricingModule,
    SalesModule,
    WishlistModule,
    ReturnsModule,
  ],
})
export class AppModule {}
