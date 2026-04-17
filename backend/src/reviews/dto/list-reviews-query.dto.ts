import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { ReviewStatus } from '../entities/review-status.enum';

export class ListProductReviewsQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatus, default: ReviewStatus.APPROVED })
  @IsOptional()
  @IsEnum(ReviewStatus, {
    message: 'status must be one of: pending, approved, rejected',
  })
  status?: ReviewStatus;
}
