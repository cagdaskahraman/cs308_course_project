import { ApiProperty } from '@nestjs/swagger';

import { ReviewAuthorResponseDto } from './review-author-response.dto';

export class ProductReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating!: number;

  @ApiProperty()
  comment!: string;

  @ApiProperty({ description: 'Whether the review passed moderation.' })
  approved!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: ReviewAuthorResponseDto })
  author!: ReviewAuthorResponseDto;
}
