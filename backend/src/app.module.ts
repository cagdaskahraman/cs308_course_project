import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from './cart/cart.module';
import { getTypeOrmModuleOptions } from './config/database.config';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmModuleOptions()),
    ProductsModule,
    OrdersModule,
    CartModule,
    UsersModule,
  ],
})
export class AppModule {}
