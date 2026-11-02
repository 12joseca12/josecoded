// Lead intake (plan 3.8, DATOS §4.3, §8.4). The route authenticates (Turnstile or server key); this service turns a
// valid request into the `p` of `create_lead`, re-prices the proposal and tells Jose. Nothing the client says about
// money, `meta` or the contact kind is stored as sent.
import { AFFILIATE_CODE_DB_RE, aiProposalSchema, createLeadInputSchema, type LeadRequest, type LeadResponse } from '@josecoded/types';

import { loadPricing, priceProposalSafely } from './pricing-lookup';
import { verifyProposalToken } from './proposal-token';
import { formatOutboxEvent } from '../jobs/outbox-drain';
import { HttpError, logEvent } from '../utils/http-error';

import type { Deps } from '../deps';

export interface LeadContext {
  /** The request carried the valid server key (Cal.com webhook through apps/web). */
  serverAuthenticated: boolean;
  /** Verified Supabase user of the optional bearer token. */
  userId?: string;
  serverKey?: string;
  /** Keeps work alive after the response (`executionCtx.waitUntil`). */
  waitUntil(promise: Promise<unknown>): void;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CALCOM_KEY = /^calcom:[A-Za-z0-9._-]{4,100}$/;
/** How long the request waits for Telegram before answering `outbox` (the send then finishes in the background). */
export const NOTIFY_WAIT_MS = 3000;

const VIA = { partner_form: 'partner' } as const;

/** A browser may only send a UUID key; `calcom:` keys belong to the server so a visitor cannot pre-empt a booking. */
function assertIdempotencyKey(key: string, ctx: LeadContext): void {
  const valid = ctx.serverAuthenticated ? UUID.test(key) || CALCOM_KEY.test(key) : UUID.test(key);
  if (!valid) throw new HttpError(400, 'invalid_request', 'Invalid idempotency key');
}

async function proposalFor(deps: Deps, request: LeadRequest, ctx: LeadContext) {
  if (request.source === 'web_proposal' && !request.proposalToken) {
    throw new HttpError(400, 'invalid_proposal', 'A proposal is required');
  }
  if (!request.proposalToken) return undefined;
  if (!ctx.serverKey) throw new HttpError(503, 'service_unavailable', 'Proposals are not available');
  const payload = await verifyProposalToken(ctx.serverKey, request.proposalToken, Math.floor(deps.clock.now().getTime() / 1000));
  if (!payload) throw new HttpError(400, 'invalid_proposal', 'The proposal is invalid or has expired');
  // the token carries a price for the visitor's screen; the lead is priced again from the published catalogue
  const price = priceProposalSafely(await loadPricing(deps), payload.pack, payload.extras);
  const aiProposal = aiProposalSchema.parse({
    pack: payload.pack,
    priceFrom: price.priceFrom,
    isApp: payload.isApp,
    pricingVersion: price.pricingVersion,
    extras: payload.extras,
    source: payload.source,
    summary: payload.summary,
    scope: payload.scope,
  });
  return { aiProposal, packCode: payload.isApp ? undefined : payload.pack, proposalId: payload.id };
}

/**
 * Tells Jose in the request that created the lead, once (NoticeLedger key `lead.created:<id>`, the one the outbox drain
 * checks), and backs it up with the outbox event. `true` when Telegram took the message.
 */
export async function notifyLead(
  deps: Deps,
  created: { leadId: string; contactId: string },
  source: string,
  packCode?: string,
): Promise<boolean> {
  const { telegram, notices } = deps;
  if (!telegram) return false;
  const key = `lead.created:${created.leadId}`;
  try {
    if (notices && (await notices.wasSent(key))) return true;
    await telegram.sendMessage(
      formatOutboxEvent({
        id: 0,
        event: 'lead.created',
        payload: { id: created.leadId, contact_id: created.contactId, source, ...(packCode ? { pack_code: packCode } : {}) },
        attempts: 1,
        createdAt: deps.clock.now(),
      }),
    );
    await notices?.markSent(key);
    return true;
  } catch {
    logEvent('leads', 'notify_failed');
    return false;
  }
}

/** Notifies in the request, waiting at most NOTIFY_WAIT_MS; the send finishes in the background either way. */
export async function notifyWithin(
  deps: Deps,
  created: { leadId: string; contactId: string },
  source: string,
  packCode: string | undefined,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<'telegram' | 'outbox'> {
  const work = notifyLead(deps, created, source, packCode);
  waitUntil(work);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sent = await Promise.race([
    work,
    new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), NOTIFY_WAIT_MS);
    }),
  ]);
  clearTimeout(timer);
  return sent ? 'telegram' : 'outbox';
}

export async function submitLead(
  deps: Deps,
  request: LeadRequest,
  ctx: LeadContext,
): Promise<{ status: 200 | 201; body: LeadResponse }> {
  if (request.source === 'calcom' && !ctx.serverAuthenticated) {
    throw new HttpError(403, 'forbidden', 'This source is not available');
  }
  assertIdempotencyKey(request.idempotencyKey, ctx);
  if (!deps.leads) throw new HttpError(503, 'service_unavailable', 'Leads are not available');

  const proposal = await proposalFor(deps, request, ctx);

  // affiliate attribution: the lead is kept whatever happens to the code
  const meta: Record<string, unknown> = {
    ...(request.meta?.path ? { path: request.meta.path } : {}),
    ...(request.meta?.utm && Object.keys(request.meta.utm).length <= 6 ? { utm: request.meta.utm } : {}),
    ...(request.contact.company ? { company: request.contact.company } : {}),
    ...(proposal ? { proposal_id: proposal.proposalId } : {}),
  };
  let affiliateCode: string | undefined;
  const rawCode = request.affiliateCode?.toUpperCase();
  if (rawCode) {
    if (!AFFILIATE_CODE_DB_RE.test(rawCode)) {
      meta.invalid_ref = true;
    } else {
      affiliateCode = rawCode;
      try {
        const owner = await deps.affiliates?.findOwner(rawCode);
        const ownerEmail = owner ? await deps.affiliates?.userEmail(owner.userId) : null;
        if (ownerEmail && request.contact.email && ownerEmail.toLowerCase() === request.contact.email.toLowerCase()) {
          meta.self_referral_suspect = true;
        }
      } catch {
        // attribution checks never lose the lead
        logEvent('leads', 'affiliate_lookup_failed');
      }
    }
  }

  const via = VIA[request.source as keyof typeof VIA] ?? 'client';
  const payload = createLeadInputSchema.parse({
    email: request.contact.email,
    phone: request.contact.phone,
    display_name: request.contact.name,
    source: request.source,
    via,
    locale: request.locale,
    idempotency_key: request.idempotencyKey,
    message: request.message,
    ...(proposal?.packCode ? { pack_code: proposal.packCode } : {}),
    ...(proposal ? { ai_proposal: proposal.aiProposal } : {}),
    ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
    ...(ctx.userId ? { user_id: ctx.userId } : {}),
    ...(request.source === 'partner_form' ? { chat_case: 'partner' } : {}),
    meta,
  });

  let created;
  try {
    created = await deps.leads.create(payload);
  } catch {
    // the RPC error text can name constraints and columns: only the fact reaches the logs
    logEvent('leads', 'create_failed');
    throw new HttpError(502, 'upstream_error', 'Could not save your request');
  }
  if (!created.created) return { status: 200, body: { leadId: created.leadId, notified: 'none' } };

  const notified = await notifyWithin(deps, created, request.source, proposal?.packCode, ctx.waitUntil);
  return { status: 201, body: { leadId: created.leadId, notified } };
}
