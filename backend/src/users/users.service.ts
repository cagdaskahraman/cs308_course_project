import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateProfileDto, UserProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
