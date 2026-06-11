import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';

type DemoUserSeed = {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  taxId: string;
  homeAddress: string;
};

@Injectable()
export class UsersDevSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersDevSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    const seedUsersEnabled = process.env.AUTO_SEED_USERS !== 'false';
    if (isProd && !seedUsersEnabled) {
      return;
    }

    const demoUsers: DemoUserSeed[] = [
      {
        email: process.env.DEMO_ADMIN_EMAIL ?? 'admin@electrostore.local',
        password: process.env.DEMO_ADMIN_PASSWORD ?? 'Admin123!',
        role: UserRole.ADMIN,
        fullName: 'Demo Admin',
        taxId: 'ADMIN-0001',
        homeAddress: 'Istanbul, Levent',
      },
      {
        email:
          process.env.DEMO_PRODUCT_MANAGER_EMAIL ?? 'pm@electrostore.local',
        password: process.env.DEMO_PRODUCT_MANAGER_PASSWORD ?? 'Manager123!',
        role: UserRole.PRODUCT_MANAGER,
        fullName: 'Demo Product Manager',
        taxId: 'PM-0001',
        homeAddress: 'Istanbul, Besiktas',
      },
      {
        email:
          process.env.DEMO_SALES_MANAGER_EMAIL ?? 'sm@electrostore.local',
        password: process.env.DEMO_SALES_MANAGER_PASSWORD ?? 'Sales123!',
        role: UserRole.SALES_MANAGER,
        fullName: 'Demo Sales Manager',
        taxId: 'SM-0001',
        homeAddress: 'Istanbul, Kadikoy',
      },
    ];

    for (const demoUser of demoUsers) {
      await this.ensureDemoUser(demoUser);
    }
  }

  private async ensureDemoUser(seed: DemoUserSeed): Promise<void> {
    const email = seed.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'role'],
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(seed.password, 10);
      await this.usersRepository.save(
        this.usersRepository.create({
          email,
          fullName: seed.fullName,
          taxId: seed.taxId,
          homeAddress: seed.homeAddress,
          passwordHash,
          role: seed.role,
        }),
      );
      this.logger.log(
        `Seeded demo ${seed.role} account (${email}) for progress demo.`,
      );
      return;
    }

    if (existing.role !== seed.role) {
      await this.usersRepository.update({ id: existing.id }, { role: seed.role });
      this.logger.log(
        `Updated role for demo account ${email}: ${existing.role} -> ${seed.role}.`,
      );
    }
  }
}
