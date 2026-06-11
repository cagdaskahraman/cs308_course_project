import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (user) => ({
        ...user,
        id: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    service = new AuthService(
      usersRepository as unknown as Repository<User>,
      jwtService as unknown as JwtService,
    );
  });

  it('registers a new customer', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    const result = await service.register({
      email: 'Buyer@Example.com',
      fullName: 'Buyer',
      password: 'Secret123!',
      confirmPassword: 'Secret123!',
    });

    expect(result.email).toBe('buyer@example.com');
    expect(result.role).toBe(UserRole.CUSTOMER);
    expect(usersRepository.save).toHaveBeenCalled();
  });

  it('rejects registration when passwords do not match', async () => {
    await expect(
      service.register({
        email: 'buyer@example.com',
        fullName: 'Buyer',
        password: 'Secret123!',
        confirmPassword: 'Mismatch',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate email registration', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register({
        email: 'buyer@example.com',
        fullName: 'Buyer',
        password: 'Secret123!',
        confirmPassword: 'Secret123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'buyer@example.com',
      fullName: 'Buyer',
      passwordHash,
      role: UserRole.CUSTOMER,
    });

    const result = await service.login({
      email: 'buyer@example.com',
      password: 'Secret123!',
    });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.email).toBe('buyer@example.com');
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('rejects login with invalid password', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'buyer@example.com',
      fullName: 'Buyer',
      passwordHash,
      role: UserRole.CUSTOMER,
    });

    await expect(
      service.login({
        email: 'buyer@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
