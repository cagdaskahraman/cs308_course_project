import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { AuthUserPayload } from '../../common/auth/jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    if (!req.user) {
      throw new Error('CurrentUser decorator used on an unauthenticated route');
    }
    return req.user;
  },
);
