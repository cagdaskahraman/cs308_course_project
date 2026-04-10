import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExtractJwt } from 'passport-jwt';

import { UserRole } from '../../users/user-role.enum';

/**
 * SCRUM-134: Public users get approved-only listings without auth.
 * When `approvedOnly=false`, enforces the same rules as JwtAuthGuard + RolesGuard with `product_manager`.
 */
@Injectable()
export class ProductReviewsListingGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const approvedOnly = parseApprovedOnlyQuery(request.query?.approvedOnly);
    if (approvedOnly) {
      return true;
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      throw new UnauthorizedException(
        'Authentication is required when approvedOnly=false.',
      );
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        role?: UserRole;
      }>(token);
      const role = payload.role ?? UserRole.Customer;
      request.user = { id: payload.sub, role };
      if (role !== UserRole.ProductManager) {
        throw new ForbiddenException(
          'Only users with the product_manager role can list unapproved reviews.',
        );
      }
      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}

function parseApprovedOnlyQuery(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return true;
  }
  if (raw === true || raw === 'true') {
    return true;
  }
  if (raw === false || raw === 'false') {
    return false;
  }
  throw new BadRequestException(
    'Query parameter approvedOnly must be true or false.',
  );
}
