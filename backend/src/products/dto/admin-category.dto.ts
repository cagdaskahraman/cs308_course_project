import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Camera' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}

export class RenameCategoryDto {
  @ApiProperty({ example: 'Headphone' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  oldName!: string;

  @ApiProperty({ example: 'Audio' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  newName!: string;
}
