import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Product } from '../products/entities/product.entity';
import { WishlistService } from './wishlist.service';

type AuthUser = { sub: string };

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'List wishlist products for the signed-in customer' })
  @ApiOkResponse({ type: [Product] })
  list(@CurrentUser() user: AuthUser): Promise<Product[]> {
    return this.wishlistService.listForUser(user.sub);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product to the wishlist' })
  @ApiCreatedResponse({ type: [Product] })
  add(
    @CurrentUser() user: AuthUser,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<Product[]> {
    return this.wishlistService.add(user.sub, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a product from the wishlist' })
  @ApiNoContentResponse({ description: 'Wishlist updated.' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<Product[]> {
    return this.wishlistService.remove(user.sub, productId);
  }
}
