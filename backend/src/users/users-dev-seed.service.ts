import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';

type StaffUserSeed = {
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

    await this.demoteLegacyAdminAccounts();

    const staffUsers: StaffUserSeed[] = [
      {
        email:
          process.env.DEMO_PRODUCT_MANAGER_EMAIL ?? 'pm@electrostore.local',
        password: process.env.DEMO_PRODUCT_MANAGER_PASSWORD ?? 'Manager123!',
        role: UserRole.PRODUCT_MANAGER,
        fullName: 'Catalog Operations',
        taxId: 'PM-0001',
        homeAddress: 'Istanbul, Besiktas',
      },
      {
        email:
          process.env.DEMO_SALES_MANAGER_EMAIL ?? 'sm@electrostore.local',
        password: process.env.DEMO_SALES_MANAGER_PASSWORD ?? 'Sales123!',
        role: UserRole.SALES_MANAGER,
        fullName: 'Sales Operations',
        taxId: 'SM-0001',
        homeAddress: 'Istanbul, Kadikoy',
      },
    ];

    for (const staffUser of staffUsers) {
      await this.ensureStaffUser(staffUser);
    }
  }

  private async demoteLegacyAdminAccounts(): Promise<void> {
    const demoted = await this.usersRepository.update(
      { role: UserRole.ADMIN },
      { role: UserRole.PRODUCT_MANAGER },
    );
    if (demoted.affected && demoted.affected > 0) {
      this.logger.log(
        `Demoted ${demoted.affected} legacy admin account(s) to product_manager.`,
      );
    }
  }

  private async ensureStaffUser(seed: StaffUserSeed): Promise<void> {
    const email = seed.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'role'],
    });

    const passwordHash = await bcrypt.hash(seed.password, 10);

    if (!existing) {
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
      this.logger.log(`Seeded staff account ${email} (${seed.role}).`);
      return;
    }

    const updates: Partial<User> = { passwordHash };
    if (existing.role !== seed.role) {
      updates.role = seed.role;
    }
    await this.usersRepository.update({ id: existing.id }, updates);
    if (existing.role !== seed.role) {
      this.logger.log(
        `Updated role for staff account ${email}: ${existing.role} -> ${seed.role}.`,
      );
    }
  }
}
