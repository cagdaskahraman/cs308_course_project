import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../users/entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  createdAt!: Date;
}
