import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PaymentDetailsDto } from './dto/payment-details.dto';
import { PaymentResultDto } from './dto/payment-result.dto';
import { PaymentStatus } from './payment-status.enum';

/**
 * Mock bank gateway. Emulates the confirmation step required before an order
 * is persisted. No real card data is stored; the handshake only returns a
 * short-lived authorization reference and the card last-4 digits.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  authorize(amount: number, details: PaymentDetailsDto): PaymentResultDto {
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Hard-coded declined test card used by e2e / demo scripts.
    const sanitizedPan = details.cardNumber.trim();
    if (sanitizedPan === '4000000000000002') {
      this.logger.warn(`[Payments] Declined card ending ${sanitizedPan.slice(-4)}`);
      throw new BadRequestException('Payment was declined by the issuing bank');
    }

    if (!PaymentsService.isLuhnValid(sanitizedPan)) {
      throw new BadRequestException('Card number failed checksum validation');
    }

    const reference = `AUTH-${randomUUID().split('-')[0]}`;
    this.logger.log(
      `[Payments] Authorized ${reference} amount=${amount} card=****${sanitizedPan.slice(-4)}`,
    );

    return {
      status: PaymentStatus.APPROVED,
      authorizationReference: reference,
      cardLast4: sanitizedPan.slice(-4),
      cardHolder: details.cardHolder.trim(),
      amount,
      authorizedAt: new Date().toISOString(),
    };
  }

  private static isLuhnValid(pan: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = pan.length - 1; i >= 0; i--) {
      let digit = pan.charCodeAt(i) - 48;
      if (digit < 0 || digit > 9) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
}
