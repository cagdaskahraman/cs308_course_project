import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '../../users/entities/user.entity';
type RequestWithUser = { user?: { role?: string } };

@Injectable()
export class ProductManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const isStaff =
      user?.role === UserRole.PRODUCT_MANAGER;
    if (!isStaff) {
      throw new ForbiddenException('product manager role required');
    }
    return true;
  }
}
