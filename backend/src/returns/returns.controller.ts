import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUserPayload, JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CreateReturnRequestDto, ReturnRequestDto } from './dto/return-request.dto';
import { ReturnsService } from './returns.service';

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my return requests' })
  @ApiOkResponse({ type: [ReturnRequestDto] })
  listMine(@CurrentUser() user: AuthUserPayload): Promise<ReturnRequestDto[]> {
    return this.returnsService.listForUser(user.sub);
  }

  @Post('orders/:orderId/items/:itemId')
  @ApiOperation({ summary: 'Request a return for a delivered order item' })
  @ApiCreatedResponse({ type: ReturnRequestDto })
  create(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateReturnRequestDto,
  ): Promise<ReturnRequestDto> {
    return this.returnsService.createForUser(orderId, itemId, user.sub, body);
  }
}
