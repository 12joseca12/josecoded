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

/**
 * Derives a per-purpose subkey: HMAC(key, label). The proposal token, the IP pepper and the chat cookie each sign
 * with their own, so a signature made for one purpose is worthless for another and a leak of one derived key does
 * not reveal the master secret.
 */
export async function deriveKey(key: string, label: 'proposal-token' | 'ip-pepper' | 'chat-cookie'): Promise<string> {
  return hmacSha256(key, `josecoded:v1:${label}`);
}

/**
 * The address that identifies a client for quotas and rate limits: an IPv4 as is, an IPv6 reduced to its /64 (a
 * subscriber gets at least a /64, so rotating the lower 64 bits must not mint a fresh identity). Anything that is
 * not an address (`unknown`) is returned as is.
 */
export function normalizeIp(ip: string): string {
  const raw = ip.trim().toLowerCase().split('%')[0] ?? '';
  if (!raw.includes(':')) return raw;
  // IPv4-mapped / embedded (::ffff:1.2.3.4): the client is that IPv4
  const mapped = /^(?:0{0,4}:){2,5}(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/.exec(raw);
  if (mapped?.[1]) return mapped[1];
  const [head = '', tail, ...extra] = raw.split('::');
  if (extra.length > 0) return raw;
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return raw;
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

/** Stable pseudonym of an IP (its /64 for IPv6) for quota keys and `chat_threads.ip_hash` (HMAC with the derived pepper when a secret is given). */
export async function hashIp(ip: string, secret?: string): Promise<string> {
  const address = normalizeIp(ip);
  const full = secret
    ? toHex(fromBase64Url(await hmacSha256(await deriveKey(secret, 'ip-pepper'), address)) ?? new Uint8Array())
    : await sha256Hex(address);
  return full.slice(0, 32);
}
