import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('password and confirmPassword must match');
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: { email },
      select: ['id'],
    });

    if (existingUser) {
      throw new ConflictException('email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: UserRole.CUSTOMER,
    });
    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
    };
  }
}
