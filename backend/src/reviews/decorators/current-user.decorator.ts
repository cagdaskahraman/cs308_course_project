import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayload } from '../guards/reviews-jwt.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!req.user) {
      throw new Error('CurrentUser decorator used on an unauthenticated route');
    }
    return req.user;
  },
);
