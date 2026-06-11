import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { ReturnStatus } from '../entities/return-status.enum';

export class CreateReturnRequestDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReturnRequestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  orderItemId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  refundAmount!: number;

  @ApiProperty({ enum: ReturnStatus })
  status!: ReturnStatus;

  @ApiProperty({ required: false })
  reason!: string | null;

  @ApiProperty()
  requestedAt!: string;
}
