import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIX = 'enc:v1:';

let cachedKey: Buffer | null = null;

function resolveKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.DATA_ENCRYPTION_KEY?.trim();

  if (raw) {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
      throw new Error(
        `DATA_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${buf.length}). ` +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      );
    }
    cachedKey = buf;
    return cachedKey;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATA_ENCRYPTION_KEY is required in production. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }

  cachedKey = Buffer.from(
    'ZGV2LW9ubHktZmFsbGJhY2sta2V5LTMyLWJ5dGVzISE=',
    'base64',
  );
  return cachedKey;
}

/** Reset the cached key — intended only for tests. */
export function _resetKeyCache(): void {
  cachedKey = null;
}

export function encrypt(plaintext: string): string {
  const key = resolveKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return (
    PREFIX +
    iv.toString('base64') +
    ':' +
    tag.toString('base64') +
    ':' +
    encrypted.toString('base64')
  );
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(PREFIX)) {
    return ciphertext;
  }

  const parts = ciphertext.slice(PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted value: expected enc:v1:<iv>:<tag>:<ciphertext>');
  }

  const key = resolveKey();
  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const data = Buffer.from(parts[2], 'base64');

  if (iv.length !== IV_BYTES) {
    throw new Error(`Invalid IV length: expected ${IV_BYTES}, got ${iv.length}`);
  }
  if (tag.length !== TAG_BYTES) {
    throw new Error(`Invalid auth tag length: expected ${TAG_BYTES}, got ${tag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Deterministic HMAC-SHA256 for indexed lookups on encrypted columns.
 * Uses the encryption key as HMAC key (acceptable for a course project;
 * production systems would derive a separate key).
 */
export function hmacLookup(value: string): string {
  const key = resolveKey();
  return createHmac('sha256', key).update(value).digest('hex');
}
