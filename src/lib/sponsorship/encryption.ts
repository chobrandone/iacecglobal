import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'v1';

function key() {
  const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY ?? '', 'base64');
  if (key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes, base64 encoded. Generate one with: openssl rand -base64 32');
  return key;
}

/** Encrypts a sensitive column with AES-256-GCM. Stored as "v1:<iv>:<tag>:<ciphertext>". */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [PREFIX, iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join(':');
}

/** Throws if the value was tampered with or the key is wrong, rather than returning bad data. */
export function decrypt(stored: string) {
  const [prefix, iv, tag, body] = stored.split(':');
  if (prefix !== PREFIX || !iv || !tag || body === undefined) throw new Error('This value is not encrypted data.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
}

export const encryptOptional = (plain?: string | null) => (plain ? encrypt(plain) : null);
export const decryptOptional = (stored?: string | null) => (stored ? decrypt(stored) : null);
