import { headers } from 'next/headers';
import { hashKey } from './rate-limit';

/**
 * The visitor's address. Anyone can send their own X-Forwarded-For, so the left of that list means
 * nothing. The right-hand entry is the one our host's proxy added, which a visitor cannot choose.
 */
export function clientIp(h: Headers) {
  return (h.get('x-forwarded-for') ?? '').split(',').at(-1)?.trim() || h.get('x-real-ip') || 'unknown';
}

/** Identifies a connection for rate limiting without storing the IP address itself. */
export async function clientFingerprint() {
  const h = await headers();
  return { ipHash: hashKey(clientIp(h)), userAgent: (h.get('user-agent') ?? '').slice(0, 300) };
}
