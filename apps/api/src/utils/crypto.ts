// Small Web Crypto helpers of the gateway (HMAC signatures, hashes, constant-time comparison). Workers only.
const encoder = new TextEncoder();

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return undefined;
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return undefined;
  }
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

/** HMAC-SHA256 of `data` with `secret`, base64url. */
export async function hmacSha256(secret: string, data: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), encoder.encode(data));
  return toBase64Url(new Uint8Array(signature));
}

/** Checks a base64url HMAC without comparing strings: `crypto.subtle.verify` is constant-time. */
export async function verifyHmacSha256(secret: string, data: string, signature: string): Promise<boolean> {
  const bytes = fromBase64Url(signature);
  if (!bytes || bytes.length !== 32) return false;
  return crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), bytes, encoder.encode(data));
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))));
}

/**
 * Constant-time equality of two secrets of any length: both are hashed to 32 bytes first, so neither the content
 * nor the length of the expected value shows in the time taken.
 */
export async function secretsEqual(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

/** Stable pseudonym of an IP for quota keys and `chat_threads.ip_hash` (HMAC when a secret is given). */
export async function hashIp(ip: string, secret?: string): Promise<string> {
  const full = secret ? toHex(fromBase64Url(await hmacSha256(secret, ip)) ?? new Uint8Array()) : await sha256Hex(ip);
  return full.slice(0, 32);
}
