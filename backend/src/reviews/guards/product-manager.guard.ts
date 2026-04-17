import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '../../users/entities/user.entity';
import { JwtPayload } from './reviews-jwt.guard';

type RequestWithUser = { user?: JwtPayload };

@Injectable()
export class ProductManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user || user.role !== UserRole.PRODUCT_MANAGER) {
      throw new ForbiddenException('product manager role required');
    }
    return true;
  }
}
