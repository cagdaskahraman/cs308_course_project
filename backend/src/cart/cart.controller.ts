import {
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUserPayload, JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new empty cart' })
  @ApiCreatedResponse({ description: 'Cart created.', type: Cart })
  createCart(): Promise<Cart> {
    return this.cartService.create();
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Merge guest cart into the current user cart',
    description:
      'Returns the authenticated user cart. If `guestCartId` is provided and belongs to no user, its items are merged in and the guest cart is removed.',
  })
  @ApiOkResponse({ description: 'Merged user cart.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  mergeCart(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: MergeCartDto,
  ): Promise<{ cart: Cart; totalPrice: number }> {
    return this.cartService.mergeForUser(user.sub, body.guestCartId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cart by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Cart found.' })
  @ApiNotFoundResponse({ description: 'Cart not found.' })
  getCart(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ cart: Cart; totalPrice: number }> {
    return this.cartService.findOne(id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({ type: AddCartItemDto })
  @ApiCreatedResponse({ description: 'Item added to cart.', type: Cart })
  @ApiBadRequestResponse({ description: 'Insufficient stock.' })
  @ApiNotFoundResponse({ description: 'Cart or product not found.' })
  addItem(@Body() body: AddCartItemDto): Promise<Cart> {
    return this.cartService.addItem(body);
  }

  @Patch(':cartId/items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'cartId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiOkResponse({ description: 'Cart item updated.', type: Cart })
  @ApiBadRequestResponse({ description: 'Insufficient stock.' })
  @ApiNotFoundResponse({ description: 'Cart or cart item not found.' })
  updateItem(
    @Param('cartId', new ParseUUIDPipe({ version: '4' })) cartId: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() body: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.cartService.updateItem(cartId, itemId, body);
  }

  @Delete(':cartId/items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'cartId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Cart item removed.' })
  @ApiNotFoundResponse({ description: 'Cart or cart item not found.' })
  removeItem(
    @Param('cartId', new ParseUUIDPipe({ version: '4' })) cartId: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ): Promise<{ cart: Cart; totalPrice: number }> {
    return this.cartService.removeItem(cartId, itemId);
  }
}
