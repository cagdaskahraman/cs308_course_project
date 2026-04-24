import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../entities/user.entity';

export class AdminUserPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}
