import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MergeCartDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Id of the guest cart to merge into the current user cart, if any.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'guestCartId must be a valid UUID v4.' })
  guestCartId?: string;
}
