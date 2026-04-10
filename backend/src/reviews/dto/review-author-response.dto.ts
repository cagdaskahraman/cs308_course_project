import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewAuthorResponseDto {
  @ApiProperty({
    description:
      'Masked email suitable for public listing (internal user id is never exposed).',
    example: 'j***@e***.com',
  })
  maskedEmail!: string;

  @ApiPropertyOptional({
    description: 'Display name when available; may be omitted for privacy.',
    example: 'Jane D.',
    nullable: true,
  })
  displayName!: string | null;
}
