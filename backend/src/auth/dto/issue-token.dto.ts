import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IssueTokenDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Existing user id in the `users` table (create user first if needed).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  userId!: string;
}
