import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiExtraModels(ProductDetailResponseDto)
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
  @ApiOperation({
    summary: 'Get product by UUID',
    description:
      'Returns product fields plus aggregate review stats: `averageRating` and `reviewCount` are computed in the database from **approved** reviews only (`approved = true`).',
  })
  @ApiOkResponse({
    description: 'Product detail including approved-review aggregates.',
    type: ProductDetailResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No product with the given id.' })
  getProductById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.findOne(id);
  }
}
