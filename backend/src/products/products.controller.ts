import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products (from database)' })
  getProducts(@Query() query: FindProductsQueryDto): Promise<Product[]> {
    return this.productsService.findAll({ ...query });
  }

  @Get('categories')
  @ApiOperation({ summary: 'List distinct product categories' })
  getCategories(): Promise<string[]> {
    return this.productsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by UUID' })
  getProductById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }
}
