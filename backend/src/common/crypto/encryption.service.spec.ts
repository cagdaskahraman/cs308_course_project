import { decrypt, encrypt, hmacLookup, _resetKeyCache } from './encryption.service';
import { encryptedColumnTransformer } from './encrypted-column.transformer';

beforeEach(() => {
  _resetKeyCache();
  delete process.env.DATA_ENCRYPTION_KEY;
  delete process.env.NODE_ENV;
});

describe('encrypt / decrypt', () => {
  it('round-trips arbitrary UTF-8 text', () => {
    const original = 'Ayşe Yılmaz — İstanbul, Kadıköy Moda Mah. No:10';
    const cipher = encrypt(original);
    expect(cipher.startsWith('enc:v1:')).toBe(true);
    expect(decrypt(cipher)).toBe(original);
  });

  it('produces ciphertext that differs from plaintext', () => {
    const original = 'secret-email@example.com';
    const cipher = encrypt(original);
    expect(cipher).not.toBe(original);
    expect(cipher).not.toContain(original);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const original = 'same-input';
    const a = encrypt(original);
    const b = encrypt(original);
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(original);
    expect(decrypt(b)).toBe(original);
  });

  it('returns legacy plaintext as-is when value lacks enc:v1: prefix', () => {
    const legacy = 'AYSE YILMAZ';
    expect(decrypt(legacy)).toBe(legacy);
  });

  it('throws on malformed encrypted values', () => {
    expect(() => decrypt('enc:v1:bad')).toThrow();
  });

  it('throws in production when DATA_ENCRYPTION_KEY is unset', () => {
    _resetKeyCache();
    process.env.NODE_ENV = 'production';
    expect(() => encrypt('test')).toThrow(/DATA_ENCRYPTION_KEY is required/);
  });

  it('throws when DATA_ENCRYPTION_KEY is wrong length', () => {
    _resetKeyCache();
    process.env.DATA_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
    expect(() => encrypt('test')).toThrow(/must decode to exactly 32 bytes/);
  });

  it('uses a custom key from DATA_ENCRYPTION_KEY', () => {
    _resetKeyCache();
    const key = require('crypto').randomBytes(32).toString('base64');
    process.env.DATA_ENCRYPTION_KEY = key;
    const cipher = encrypt('hello');
    expect(decrypt(cipher)).toBe('hello');
  });

  it('fails to decrypt with a different key', () => {
    const cipher = encrypt('hello');
    _resetKeyCache();
    process.env.DATA_ENCRYPTION_KEY = require('crypto')
      .randomBytes(32)
      .toString('base64');
    expect(() => decrypt(cipher)).toThrow();
  });
});

describe('hmacLookup', () => {
  it('produces a deterministic hex string', () => {
    const a = hmacLookup('user@example.com');
    const b = hmacLookup('user@example.com');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different hashes for different inputs', () => {
    expect(hmacLookup('a@b.com')).not.toBe(hmacLookup('c@d.com'));
  });
});

describe('encryptedColumnTransformer', () => {
  it('encrypts on write and decrypts on read', () => {
    _resetKeyCache();
    const original = 'Istanbul, Besiktas';
    const stored = encryptedColumnTransformer.to(original);
    expect(stored).not.toBe(original);
    expect(encryptedColumnTransformer.from(stored as string)).toBe(original);
  });

  it('passes null through without change', () => {
    expect(encryptedColumnTransformer.to(null)).toBeNull();
    expect(encryptedColumnTransformer.from(null)).toBeNull();
  });

  it('passes undefined through without change', () => {
    expect(encryptedColumnTransformer.to(undefined)).toBeUndefined();
    expect(encryptedColumnTransformer.from(undefined)).toBeUndefined();
  });

  it('transparently handles legacy plaintext on read', () => {
    const legacy = 'plain old address';
    expect(encryptedColumnTransformer.from(legacy)).toBe(legacy);
  });

  it('round-trips invoice billing fields', () => {
    const fields = [
      'buyer@example.com',
      '4242',
      'AUTH-TEST-REF-001',
    ];
    for (const value of fields) {
      const stored = encryptedColumnTransformer.to(value);
      expect(stored).not.toBe(value);
      expect(encryptedColumnTransformer.from(stored as string)).toBe(value);
    }
  });
});

describe('encrypt / decrypt edge cases', () => {
  it('round-trips empty string', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  it('round-trips long billing address text', () => {
    const address =
      'Moda Mah. Caferaga Sok. No:12 D:4 Kadikoy Istanbul 34710 Turkey';
    expect(decrypt(encrypt(address))).toBe(address);
  });
});
