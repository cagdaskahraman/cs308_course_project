import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { AuthUserPayload } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    if (!request.user) {
      throw new Error('CurrentUser used without JwtAuthGuard');
    }
    return request.user;
  },
);
