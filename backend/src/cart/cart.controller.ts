import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
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

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiCreatedResponse({ description: 'Item added to cart.', type: Cart })
  @ApiNotFoundResponse({ description: 'Cart or product not found.' })
  addItem(@Body() body: AddCartItemDto): Promise<Cart> {
    return this.cartService.addItem(body);
  }
}
