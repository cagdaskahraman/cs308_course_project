import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Product } from './product.type';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'price' | 'popularity',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Product[] {
    return this.productsService.findAll({ search, sortBy, sortOrder });
  }

  @Get(':id')
  getProductById(@Param('id', ParseIntPipe) id: number): Product {
    return this.productsService.findOne(id);
  }
}
