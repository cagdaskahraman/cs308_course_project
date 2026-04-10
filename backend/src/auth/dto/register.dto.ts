import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Secure123!',
    minLength: 8,
    description:
      'At least 8 chars, including at least one letter and one number.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must include at least one letter and one number',
  })
  password!: string;

  @ApiProperty({ example: 'Secure123!' })
  @IsString()
  confirmPassword!: string;
}
