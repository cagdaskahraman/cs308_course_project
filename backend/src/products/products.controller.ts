import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { Review } from '../reviews/entities/review.entity';
import { ReviewsService } from '../reviews/reviews.service';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
  ) {}

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

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a review for a product' })
  @ApiCreatedResponse({ description: 'Review stored; approval pending.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  submitReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.create(id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by UUID' })
  getProductById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }
}
