import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { ReviewStatus } from '../entities/review-status.enum';

export class ListModerationReviewsQueryDto {
  @ApiPropertyOptional({
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
    description: 'Filter by moderation state (defaults to pending).',
  })
  @IsOptional()
  @IsEnum(ReviewStatus, {
    message: 'status must be one of: pending, approved, rejected',
  })
  status?: ReviewStatus;
}
