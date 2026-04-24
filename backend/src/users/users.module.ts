import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminRoleGuard } from '../common/auth/admin-role.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { AdminUsersController } from './admin-users.controller';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AdminUsersController],
  providers: [UsersService, JwtAuthGuard, AdminRoleGuard],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
