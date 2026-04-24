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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUserPayload, JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { StaffRoleGuard } from '../common/auth/staff-role.guard';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Checkout',
    description:
      'Places an order for the authenticated user: validates stock, decreases product stock, persists order and line items in one transaction.',
  })
  @ApiCreatedResponse({
    description: 'Order created; stock updated.',
    type: Order,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or insufficient stock for a product.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token — login required.',
  })
  @ApiNotFoundResponse({
    description: 'A product id in the cart does not exist.',
  })
  checkout(
    @Body() body: CheckoutDto,
    @CurrentUser() user: AuthUserPayload,
  ): Promise<Order> {
    return this.ordersService.checkout(body, {
      sub: user.sub,
      email: user.email,
      role: user.role,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List my orders',
    description:
      'Returns all orders placed by the authenticated user, newest first, including line items.',
  })
  @ApiOkResponse({ description: 'Orders for the current user.', type: [Order] })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token — login required.',
  })
  listMyOrders(@CurrentUser() user: AuthUserPayload): Promise<Order[]> {
    return this.ordersService.findForCurrentUser(user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order by id',
    description: 'Returns the order with line items and nested product details.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Order found.', type: Order })
  @ApiNotFoundResponse({ description: 'Order does not exist.' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token — login required.',
  })
  getOrderById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthUserPayload,
  ): Promise<Order> {
    return this.ordersService.findOneForUser(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, StaffRoleGuard)
  @ApiBearerAuth()
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
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token — login required.',
  })
  @ApiForbiddenResponse({
    description: 'Only product manager or admin can update statuses.',
  })
  @ApiNotFoundResponse({ description: 'Order does not exist.' })
  updateOrderStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, body);
  }
}
