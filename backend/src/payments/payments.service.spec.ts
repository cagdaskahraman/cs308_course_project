import { BadRequestException } from '@nestjs/common';

import { PaymentStatus } from './payment-status.enum';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const service = new PaymentsService();

  const validCard = {
    cardHolder: 'AYSE YILMAZ',
    cardNumber: '4242424242424242',
    expiry: '08/28',
    cvc: '737',
  };

  it('authorizes a valid mock card and returns the last 4 digits', () => {
    const result = service.authorize(199.5, validCard);
    expect(result.status).toBe(PaymentStatus.APPROVED);
    expect(result.cardLast4).toBe('4242');
    expect(result.amount).toBe(199.5);
    expect(result.authorizationReference).toMatch(/^AUTH-/);
    expect(() => new Date(result.authorizedAt)).not.toThrow();
  });

  it('rejects the known declined test card', () => {
    expect(() =>
      service.authorize(50, { ...validCard, cardNumber: '4000000000000002' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a non-positive amount', () => {
    expect(() => service.authorize(0, validCard)).toThrow(BadRequestException);
  });

  it('rejects a card number that fails the Luhn checksum', () => {
    expect(() =>
      service.authorize(10, { ...validCard, cardNumber: '4242424242424241' }),
    ).toThrow(BadRequestException);
  });
});
