import { Module } from '@nestjs/common';
import { HelloModule } from './hello/hello.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [HelloModule, ProductsModule],
})
export class AppModule {}
