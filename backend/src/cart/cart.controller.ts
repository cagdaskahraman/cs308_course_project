import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
}
