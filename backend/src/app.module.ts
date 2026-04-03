import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmModuleOptions } from './config/database.config';
import { HelloModule } from './hello/hello.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmModuleOptions()),
    HelloModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
