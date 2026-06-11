import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
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
import { ReturnRequestDto } from './dto/return-request.dto';
import { ReturnStatus } from './entities/return-status.enum';
import { ReturnsService } from './returns.service';

@ApiTags('admin returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SalesManagerRoleGuard)
@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'List return requests for sales manager review' })
  @ApiOkResponse({ type: [ReturnRequestDto] })
  list(@Query('status') status?: ReturnStatus): Promise<ReturnRequestDto[]> {
    return this.returnsService.listForStaff(status);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve return, restore stock, and issue refund' })
  @ApiOkResponse({ type: ReturnRequestDto })
  approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReturnRequestDto> {
    return this.returnsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a return request' })
  @ApiOkResponse({ type: ReturnRequestDto })
  reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReturnRequestDto> {
    return this.returnsService.reject(id);
  }
}
