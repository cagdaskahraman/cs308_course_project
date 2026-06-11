import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '../../users/entities/user.entity';

type RequestWithUser = { user?: { role?: string } };

@Injectable()
export class ProductManagerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;
    const allowed =
      role === UserRole.PRODUCT_MANAGER || role === UserRole.ADMIN;
    if (!allowed) {
      throw new ForbiddenException('product manager or admin role required');
    }
    return true;
  }
}
