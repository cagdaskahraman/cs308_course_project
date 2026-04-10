import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../users/user-role.enum';

export type JwtPayload = { sub: string; role?: UserRole };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-production',
    });
  }

  validate(payload: JwtPayload): { id: string; role: UserRole } {
    return {
      id: payload.sub,
      role: payload.role ?? UserRole.Customer,
    };
  }
}
