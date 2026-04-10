import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from './cart/cart.module';
import { getTypeOrmModuleOptions } from './config/database.config';
import { HelloModule } from './hello/hello.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmModuleOptions()),
    HelloModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    ReviewsModule,
  ],
})
export class AppModule {}
