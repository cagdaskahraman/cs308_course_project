import { ApiProperty } from '@nestjs/swagger';

export class ApproveReviewResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Approved review id.' })
  reviewId!: string;

  @ApiProperty({ example: true, description: 'Always true after a successful call.' })
  approved!: boolean;
}
