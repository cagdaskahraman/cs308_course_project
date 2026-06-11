import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { SalesManagerRoleGuard } from '../common/auth/sales-manager-role.guard';
import { Product } from '../products/entities/product.entity';
import {
  ApplyDiscountDto,
  UpdateProductPricingDto,
} from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('admin pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SalesManagerRoleGuard)
@Controller('admin/pricing')
export class AdminPricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('products')
  @ApiOperation({ summary: 'List products for sales pricing management' })
  @ApiOkResponse({ type: [Product] })
  listProducts(): Promise<Product[]> {
    return this.pricingService.listProductsForPricing();
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Set list price and optional discount for a product' })
  @ApiOkResponse({ type: Product })
  updatePricing(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductPricingDto,
  ): Promise<Product> {
    return this.pricingService.updateProductPricing(id, body);
  }

  @Post('discounts')
  @ApiOperation({ summary: 'Apply a discount rate to selected products' })
  @ApiOkResponse({ type: [Product] })
  applyDiscount(@Body() body: ApplyDiscountDto): Promise<Product[]> {
    return this.pricingService.applyDiscount(body);
  }
}
