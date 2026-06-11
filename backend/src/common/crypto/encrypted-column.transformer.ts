import { ValueTransformer } from 'typeorm';

import { decrypt, encrypt } from './encryption.service';

/**
 * TypeORM ValueTransformer that encrypts column values before writing to
 * the database and decrypts when reading. Null/undefined values pass through
 * unchanged. Legacy plaintext values (those not starting with the `enc:v1:`
 * prefix) are returned as-is so existing dev DB rows keep working.
 */
export const encryptedColumnTransformer: ValueTransformer = {
  to(value: string | null | undefined): string | null | undefined {
    if (value == null) return value;
    return encrypt(value);
  },
  from(value: string | null | undefined): string | null | undefined {
    if (value == null) return value;
    return decrypt(value);
  },
};
