import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateProductPricingDto {
  @ApiProperty({ example: 74999, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  listPrice!: number;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountRate?: number;
}

export class ApplyDiscountDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds!: string[];

  @ApiProperty({ example: 15, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountRate!: number;
}

export class SalesDateRangeQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  from!: string;

  @ApiProperty({ example: '2026-12-31' })
  to!: string;
}

export class RevenueSummaryDto {
  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty()
  invoiceCount!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  averageOrderValue!: number;
}
