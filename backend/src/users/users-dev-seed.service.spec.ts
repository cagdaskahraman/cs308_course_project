import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User, UserRole } from './entities/user.entity';
import { UsersDevSeedService } from './users-dev-seed.service';

describe('UsersDevSeedService', () => {
  let service: UsersDevSeedService;
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const oldEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...oldEnv,
      NODE_ENV: 'test',
      AUTO_SEED_USERS: 'true',
      DEMO_PRODUCT_MANAGER_EMAIL: 'pm@test.local',
      DEMO_PRODUCT_MANAGER_PASSWORD: 'Manager123!',
      DEMO_SALES_MANAGER_EMAIL: 'sm@test.local',
      DEMO_SALES_MANAGER_PASSWORD: 'Sales123!',
    };

    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersDevSeedService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersDevSeedService>(UsersDevSeedService);
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it('creates PM and SM staff accounts when they do not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockResolvedValue(undefined);

    await service.onApplicationBootstrap();

    expect(usersRepository.update).toHaveBeenCalledWith(
      { role: UserRole.ADMIN },
      { role: UserRole.PRODUCT_MANAGER },
    );
    expect(usersRepository.save).toHaveBeenCalledTimes(2);
    const roles = usersRepository.save.mock.calls.map(
      (call) => call[0].role as UserRole,
    );
    expect(roles).toEqual([UserRole.PRODUCT_MANAGER, UserRole.SALES_MANAGER]);
  });

  it('updates role when staff account exists with wrong role', async () => {
    usersRepository.findOne
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'pm@test.local',
        role: UserRole.CUSTOMER,
      })
      .mockResolvedValueOnce({
        id: 'user-2',
        email: 'sm@test.local',
        role: UserRole.SALES_MANAGER,
      });

    await service.onApplicationBootstrap();

    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(usersRepository.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({
        role: UserRole.PRODUCT_MANAGER,
        passwordHash: expect.any(String),
      }),
    );
  });
});
