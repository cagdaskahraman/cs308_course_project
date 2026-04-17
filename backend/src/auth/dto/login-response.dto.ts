import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../users/entities/user.entity';

class LoginUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}
