import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Mock payment details submitted alongside checkout.
 *
 * This intentionally does NOT persist card data anywhere; the values are
 * validated only to emulate a bank handshake and then discarded. The project
 * brief marks card verification and limit checks as out of scope.
 */
export class PaymentDetailsDto {
  @ApiProperty({
    description:
      'Cardholder full name as it appears on the card. Used for mock authorization only.',
    example: 'AYSE YILMAZ',
    minLength: 2,
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty({ message: 'cardHolder is required' })
  @MinLength(2, { message: 'cardHolder must be at least 2 characters' })
  @MaxLength(60, { message: 'cardHolder must be at most 60 characters' })
  cardHolder!: string;

  @ApiProperty({
    description:
      '13-19 digit card number. Only format is validated — not a real PAN check.',
    example: '4242424242424242',
  })
  @IsString()
  @Matches(/^\d{13,19}$/, {
    message: 'cardNumber must be 13 to 19 digits',
  })
  cardNumber!: string;

  @ApiProperty({
    description: 'Card expiry in MM/YY format.',
    example: '08/28',
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'expiry must be in MM/YY format',
  })
  expiry!: string;

  @ApiProperty({
    description: '3 or 4 digit card verification code.',
    example: '737',
  })
  @IsString()
  @Length(3, 4, { message: 'cvc must be 3 or 4 digits' })
  @Matches(/^\d+$/, { message: 'cvc must be numeric' })
  cvc!: string;
}
