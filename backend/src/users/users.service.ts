import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateProfileDto, UserProfileDto } from './dto/update-profile.dto';
import { User, UserRole } from './entities/user.entity';

export type AdminUserSummary = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAllForAdmin(): Promise<AdminUserSummary[]> {
    const rows = await this.usersRepository.find({
      select: ['id', 'email', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return rows;
  }

  async updateRoleForAdmin(
    targetUserId: string,
    newRole: UserRole,
  ): Promise<AdminUserSummary> {
    const target = await this.usersRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'email', 'role', 'createdAt'],
    });
    if (!target) {
      throw new NotFoundException('user not found');
    }

    if (target.role === newRole) {
      return target;
    }

    const adminCount = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });

    if (target.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      if (adminCount <= 1) {
        throw new BadRequestException(
          'cannot remove or demote the last administrator',
        );
      }
    }

    await this.usersRepository.update({ id: targetUserId }, { role: newRole });

    const updated = await this.usersRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'email', 'role', 'createdAt'],
    });
    if (!updated) {
      throw new NotFoundException('user not found');
    }

    return updated;
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'fullName', 'taxId', 'homeAddress', 'role'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return UsersService.toProfileDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'fullName', 'taxId', 'homeAddress', 'role'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.taxId !== undefined) {
      user.taxId = dto.taxId.trim() || null;
    }
    if (dto.homeAddress !== undefined) {
      user.homeAddress = dto.homeAddress.trim() || null;
    }

    const saved = await this.usersRepository.save(user);
    return UsersService.toProfileDto(saved);
  }

  private static toProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? '',
      taxId: user.taxId,
      homeAddress: user.homeAddress,
      role: user.role,
    };
  }
}
