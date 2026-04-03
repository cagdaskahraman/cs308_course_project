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

import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by id',
    description: 'Returns the order with line items and nested product details.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Order found.', type: Order })
  @ApiNotFoundResponse({ description: 'Order does not exist.' })
  getOrderById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Applies the order lifecycle: processing → in-transit | cancelled; in-transit → delivered; delivered and cancelled are final.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkResponse({
    description: 'Status updated; returns full order.',
    type: Order,
  })
  @ApiBadRequestResponse({
    description: 'Invalid status transition for the current order state.',
  })
  @ApiNotFoundResponse({ description: 'Order does not exist.' })
  updateOrderStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, body);
  }
}
