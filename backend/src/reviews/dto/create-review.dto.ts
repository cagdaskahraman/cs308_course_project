import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 5,
    description: 'Star rating from 1 (lowest) to 5 (highest).',
    example: 4,
  })
  @Type(() => Number)
  @IsInt({ message: 'Rating must be an integer between 1 and 5.' })
  @Min(1, { message: 'Rating must be an integer between 1 and 5.' })
  @Max(5, { message: 'Rating must be an integer between 1 and 5.' })
  rating!: number;

  @ApiProperty({
    type: 'string',
    description: 'Written review text; cannot be empty or whitespace-only.',
    example: 'Great battery life and screen. Shipping was fast.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Comment must be a non-empty string.' })
  comment!: string;
}
