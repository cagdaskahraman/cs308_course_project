import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Apple iPhone 16' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'iPhone 16' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  model!: string;

  @ApiProperty({ example: 'SN-PH-0100' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  serialNumber!: string;

  @ApiProperty({ example: 'Flagship smartphone with OLED display.' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 'Phone' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category!: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @MinLength(1)
  imageUrl!: string;

  @ApiProperty({ example: 74999, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price!: number;

  @ApiProperty({ example: 12, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @ApiProperty({ example: '2 years' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  warrantyStatus!: string;

  @ApiProperty({ example: 'Apple Turkey Distribution, Istanbul' })
  @IsString()
  @MinLength(1)
  distributorInfo!: string;

  @ApiPropertyOptional({ example: 50, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  popularity?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  imageUrl?: string;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  warrantyStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  distributorInfo?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  popularity?: number;
}

export class UpdateProductStockDto {
  @ApiProperty({ example: 25, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;
}

export class AdminProductsQueryDto {
  @ApiPropertyOptional({ description: 'Search in name, model, serial number, or description.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category.' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class ProductIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id!: string;
}
