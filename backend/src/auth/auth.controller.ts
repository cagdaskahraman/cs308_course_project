import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { IssueTokenDto } from './dto/issue-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue JWT for an existing user',
    description:
      'Returns a Bearer token for `Authorization: Bearer <token>`. For development; replace with proper login in production.',
  })
  @ApiBody({ type: IssueTokenDto })
  issueToken(@Body() body: IssueTokenDto): Promise<{ access_token: string }> {
    return this.authService.issueTokenForUser(body.userId);
  }
}
