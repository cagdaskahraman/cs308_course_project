import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

// Cart controller
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

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
}
