import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '../../users/entities/user.entity';

type RequestWithUser = { user?: { role?: string } };

@Injectable()
export class SalesManagerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;
    if (role !== UserRole.SALES_MANAGER) {
      throw new ForbiddenException('sales manager role required');
    }
    return true;
  }
}
