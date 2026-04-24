import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AdminRoleGuard } from '../common/auth/admin-role.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUserPayload, JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { AdminUserPublicDto } from './dto/admin-user-public.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@ApiTags('Admin — users')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all users',
    description:
      'Returns every account (id, email, role, createdAt). Restricted to administrators.',
  })
  @ApiOkResponse({ description: 'User directory.', type: [AdminUserPublicDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is not an administrator.' })
  list(@CurrentUser() _actor: AuthUserPayload) {
    return this.usersService.findAllForAdmin();
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change a user role',
    description:
      'Sets role to customer, product_manager, or admin. The last admin cannot be demoted.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'User after update.', type: AdminUserPublicDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is not an administrator.' })
  @ApiNotFoundResponse({ description: 'User id does not exist.' })
  @ApiBadRequestResponse({
    description: 'e.g. demoting the only remaining administrator.',
  })
  updateRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRoleForAdmin(id, body.role);
  }
}
