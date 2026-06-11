import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (user) => user),
    };
    service = new UsersService(usersRepository as unknown as Repository<User>);
  });

  it('returns the current user profile', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'buyer@example.com',
      fullName: 'Buyer',
      taxId: 'TAX-1',
      homeAddress: 'Istanbul',
      role: UserRole.CUSTOMER,
    });

    const profile = await service.getProfile('user-1');

    expect(profile.email).toBe('buyer@example.com');
    expect(profile.taxId).toBe('TAX-1');
  });

  it('updates profile fields', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'buyer@example.com',
      fullName: 'Buyer',
      taxId: null,
      homeAddress: null,
      role: UserRole.CUSTOMER,
    });

    const profile = await service.updateProfile('user-1', {
      taxId: 'TAX-99',
      homeAddress: 'Ankara',
    });

    expect(profile.taxId).toBe('TAX-99');
    expect(profile.homeAddress).toBe('Ankara');
    expect(usersRepository.save).toHaveBeenCalled();
  });

  it('throws when profile user is missing', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
