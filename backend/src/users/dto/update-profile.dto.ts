import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  taxId?: string;

  @ApiPropertyOptional({ example: 'Istanbul, Kadikoy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeAddress?: string;
}

export class UserProfileDto {
  @ApiPropertyOptional()
  id!: string;

  @ApiPropertyOptional()
  email!: string;

  @ApiPropertyOptional()
  fullName!: string;

  @ApiPropertyOptional({ required: false })
  taxId!: string | null;

  @ApiPropertyOptional({ required: false })
  homeAddress!: string | null;

  @ApiPropertyOptional()
  role!: string;
}
