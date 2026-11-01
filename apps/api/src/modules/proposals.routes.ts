import { Hono } from 'hono';

import { proposalRequestSchema } from '@josecoded/types';

import { nativeRateLimit } from '../middlewares/native-rate-limit.middleware';
import { generateProposal } from '../services/proposals.service';
import { intFromEnv } from '../services/quota.service';
import { ok } from '../utils/api-response';
import { clientIp, readJson } from '../utils/request';

import type { AppEnv } from '../deps';

const MAX_BODY_BYTES = 8 * 1024;

export const proposalsRoutes = new Hono<AppEnv>();

/**
 * POST /api/v1/proposals/generate: Turnstile (action `proposal`), AI_RATE_LIMITER 20/min per IP, daily quota per IP
 * (default 10) and global (default 300), body up to 8 KiB.
 */
proposalsRoutes.post(
  '/generate',
  nativeRateLimit((env) => env.AI_RATE_LIMITER, { keyPrefix: 'proposals' }),
  async (c) => {
    const input = await readJson(c, proposalRequestSchema, MAX_BODY_BYTES);
    const proposal = await generateProposal(
      c.var.deps,
      {
        limitIp: intFromEnv(c.env.PROPOSALS_DAILY_LIMIT_IP, 10),
        limitAll: intFromEnv(c.env.PROPOSALS_DAILY_LIMIT_ALL, 300),
        serverKey: c.env.SERVER_KEY,
      },
      { ...input, ip: clientIp(c) },
    );
    c.header('Cache-Control', 'no-store');
    return c.json(ok(proposal));
  },
);
