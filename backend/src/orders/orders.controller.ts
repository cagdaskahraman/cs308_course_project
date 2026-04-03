import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CheckoutDto } from './dto/checkout.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Checkout',
    description:
      'Places an order: validates stock, decreases product stock, persists order and line items in one transaction.',
  })
  @ApiCreatedResponse({
    description: 'Order created; stock updated.',
    type: Order,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or insufficient stock for a product.',
  })
  @ApiNotFoundResponse({
    description: 'A product id in the cart does not exist.',
  })
  checkout(@Body() body: CheckoutDto): Promise<Order> {
    return this.ordersService.checkout(body);
  }
}
