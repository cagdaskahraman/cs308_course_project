import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateReviewCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1, { message: 'comment cannot be empty' })
  @MaxLength(2000, { message: 'comment must be at most 2000 characters' })
  comment!: string;
}
