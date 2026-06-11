import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ProductManagerRoleGuard } from '../common/auth/product-manager-role.guard';
import { CreateCategoryDto, RenameCategoryDto } from './dto/admin-category.dto';
import {
  AdminProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStockDto,
} from './dto/admin-product.dto';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('admin products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProductManagerRoleGuard)
@Controller('admin')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  @ApiOperation({ summary: 'List products for catalog management' })
  @ApiOkResponse({ type: [Product] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  listProducts(@Query() query: AdminProductsQueryDto): Promise<Product[]> {
    return this.productsService.findAllForAdmin(query);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: Product })
  @ApiConflictResponse({ description: 'Serial number already exists.' })
  createProduct(@Body() body: CreateProductDto): Promise<Product> {
    return this.productsService.createProduct(body);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product metadata and stock (pricing is sales manager only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: Product })
  @ApiNotFoundResponse({ description: 'Product does not exist.' })
  @ApiConflictResponse({ description: 'Serial number already exists.' })
  updateProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.updateProduct(id, body);
  }

  @Patch('products/:id/stock')
  @ApiOperation({ summary: 'Update product stock quantity only' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: Product })
  updateStock(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductStockDto,
  ): Promise<Product> {
    return this.productsService.updateStock(id, body);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product not referenced by orders' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Product deleted.' })
  @ApiConflictResponse({ description: 'Product is referenced by existing orders.' })
  async deleteProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.productsService.deleteProduct(id);
  }

  @Post('products/upload-image')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a product image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: { imageUrl: { type: 'string', example: '/uploads/products/abc123.jpg' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/products',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
        }
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): { imageUrl: string } {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return { imageUrl: `/uploads/products/${file.filename}` };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List managed product categories' })
  @ApiOkResponse({ type: [String] })
  listCategories(): Promise<string[]> {
    return this.productsService.getCategories();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a category name' })
  @ApiCreatedResponse({ type: ProductCategory })
  @ApiConflictResponse({ description: 'Category already exists.' })
  createCategory(@Body() body: CreateCategoryDto): Promise<ProductCategory> {
    return this.productsService.createCategory(body);
  }

  @Patch('categories')
  @ApiOperation({ summary: 'Rename a category across catalog products' })
  @ApiOkResponse({ type: [String] })
  renameCategory(@Body() body: RenameCategoryDto): Promise<string[]> {
    return this.productsService.renameCategory(body);
  }

  @Delete('categories/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an unused category name' })
  @ApiParam({ name: 'name' })
  @ApiNoContentResponse({ description: 'Category deleted.' })
  @ApiConflictResponse({ description: 'Category still has products.' })
  async deleteCategory(@Param('name') name: string): Promise<void> {
    await this.productsService.deleteCategory(decodeURIComponent(name));
  }
}
