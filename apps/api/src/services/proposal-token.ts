// `proposalToken`: the generated proposal travels with the visitor as an HMAC-signed token (SERVER_KEY, no KV), so
// POST /leads can trust the pack and extras without a lookup. The price in it is informative: the lead is re-priced.
import { z } from 'zod';

import { APP_CODES, EXTRA_CODES, PACK_CODES } from '@josecoded/types';

import { fromBase64Url, hmacSha256, toBase64Url, verifyHmacSha256 } from '../utils/crypto';

export const PROPOSAL_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const proposalTokenPayloadSchema = z.object({
  v: z.literal(1),
  id: z.uuid(),
  pack: z.enum([...PACK_CODES, ...APP_CODES]),
  extras: z.array(z.enum(EXTRA_CODES)).max(6),
  priceFrom: z.number().int().nonnegative(),
  isApp: z.boolean(),
  pricingVersion: z.string(),
  locale: z.enum(['es', 'en']),
  source: z.enum(['ai', 'rules']),
  summary: z.string().max(600),
  scope: z.array(z.string().max(200)).max(6),
  /** Seconds since the epoch. */
  exp: z.number().int(),
});

export type ProposalTokenPayload = z.infer<typeof proposalTokenPayloadSchema>;

export async function signProposalToken(secret: string, payload: ProposalTokenPayload): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmacSha256(secret, body)}`;
}

/** The payload of a genuine, unexpired token; `null` for anything else (the caller does not learn which). */
export async function verifyProposalToken(
  secret: string,
  token: string,
  nowSeconds: number,
): Promise<ProposalTokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts as [string, string];
  if (!(await verifyHmacSha256(secret, body, signature))) return null;
  const bytes = fromBase64Url(body);
  if (!bytes) return null;
  try {
    const parsed = proposalTokenPayloadSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success && parsed.data.exp > nowSeconds ? parsed.data : null;
  } catch {
    return null;
  }
}
