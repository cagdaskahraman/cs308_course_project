import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type AuthedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtPayload;
};

/**
 * Verifies a Bearer JWT on the incoming request and attaches the payload
 * to `request.user`. Scoped locally to the reviews module to avoid coupling
 * with shared auth guards owned by other tasks.
 */
@Injectable()
export class ReviewsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers['authorization'];
    if (!header || typeof header !== 'string') {
      throw new UnauthorizedException('missing authorization header');
    }

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('invalid authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('invalid or expired token');
    }
  }
}
