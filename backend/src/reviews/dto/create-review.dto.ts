import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from '../review-rating.constants';

export class CreateReviewDto {
  @ApiProperty({
    minimum: REVIEW_RATING_MIN,
    maximum: REVIEW_RATING_MAX,
    example: 4,
  })
  @Type(() => Number)
  @IsInt({ message: 'Rating must be a whole number.' })
  @Min(REVIEW_RATING_MIN, {
    message: `Rating must be at least ${REVIEW_RATING_MIN}.`,
  })
  @Max(REVIEW_RATING_MAX, {
    message: `Rating must be at most ${REVIEW_RATING_MAX}.`,
  })
  rating!: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
