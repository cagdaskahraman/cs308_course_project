import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
} from 'class-validator';

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

export class ListProductReviewsQueryDto {
  @ApiPropertyOptional({
    description:
      'If true or omitted, only approved reviews are returned (public). ' +
      'If false, unapproved reviews are included but **requires** a JWT with the `product_manager` role.',
    default: true,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  approvedOnly?: boolean;
}
