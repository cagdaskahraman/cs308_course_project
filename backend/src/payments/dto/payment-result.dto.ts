import { ApiProperty } from '@nestjs/swagger';

import { PaymentStatus } from '../payment-status.enum';

export class PaymentResultDto {
  @ApiProperty({ enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({
    description: 'Mock authorization reference returned by the fake gateway.',
    example: 'AUTH-3f9a8b2c',
  })
  authorizationReference!: string;

  @ApiProperty({
    description: 'Last 4 digits of the card that were authorized.',
    example: '4242',
  })
  cardLast4!: string;

  @ApiProperty({
    description: 'Cardholder name captured at authorization time.',
    example: 'AYSE YILMAZ',
  })
  cardHolder!: string;

  @ApiProperty({ description: 'Amount authorized, in store currency.' })
  amount!: number;

  @ApiProperty({ description: 'ISO timestamp of the authorization.' })
  authorizedAt!: string;
}
