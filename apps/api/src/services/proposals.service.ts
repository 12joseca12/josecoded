// Proposal generator (plan 3.7, DT §3.2). Order: Turnstile (a bot costs no quota) -> per-IP and global daily quota
// -> model (JSON mode, through the AI Gateway) -> zod -> deterministic guard -> price by rules. Any model failure
// ends in the rule classifier: the visitor never sees an error because of the AI.
import { priceForProposal, pricing } from '@josecoded/pricing';
import { proposalModelOutputSchema, type ExtraCode, type ProposalResponse } from '@josecoded/types';

import {
  buildSystemPrompt,
  buildUserMessage,
  classifyByRules,
  PROPOSAL_JSON_SCHEMA,
  rulesTexts,
  type Locale,
  type ProposalAnswers,
  type ProposalPackCode,
} from './proposal-classifier';
import { PROPOSAL_TOKEN_TTL_SECONDS, signProposalToken } from './proposal-token';
import { checkQuota, DAY_SECONDS, dayKey } from './quota.service';
import { guardModelOutput } from '../utils/ai-guard';
import { hashIp } from '../utils/crypto';
import { HttpError, logEvent } from '../utils/http-error';

import type { Deps } from '../deps';

export interface ProposalsConfig {
  limitIp: number;
  limitAll: number;
  /** HMAC key of `proposalToken` and pepper of the IP hash. */
  serverKey?: string;
}

export interface ProposalInput {
  locale: Locale;
  turnstileToken: string;
  answers: ProposalAnswers;
  preselectedPack?: ProposalPackCode;
  ip: string;
}

const DISCLAIMER = {
  es: 'Orientativo. El precio cerrado va en la propuesta que te mando.',
  en: 'Indicative. The closed price comes in the proposal I send you.',
} as const;

/** Model proposal if it parses, passes the guard and is in the right language; `undefined` otherwise. */
async function askModel(deps: Deps, input: ProposalInput) {
  if (!deps.ai) return undefined;
  let raw: unknown;
  try {
    raw = await deps.ai.complete({
      consumer: 'proposals',
      system: buildSystemPrompt(input.locale),
      messages: [{ role: 'user', content: buildUserMessage(input.answers, input.preselectedPack) }],
      jsonSchema: PROPOSAL_JSON_SCHEMA,
      maxTokens: 700,
      temperature: 0.2,
      timeoutMs: 12_000,
    });
    if (typeof raw === 'string') raw = JSON.parse(raw);
  } catch {
    logEvent('proposals', 'ai_failed');
    return undefined;
  }
  const parsed = proposalModelOutputSchema.safeParse(raw);
  if (!parsed.success) {
    logEvent('proposals', 'ai_invalid_output');
    return undefined;
  }
  const { summary, scope, questions } = parsed.data;
  const guard = guardModelOutput([summary, ...scope, ...questions].join('\n'), { locale: input.locale });
  if (!guard.ok) {
    logEvent('proposals', 'ai_guard_rejected', { reason: guard.reason });
    return undefined;
  }
  return parsed.data;
}

export async function generateProposal(deps: Deps, config: ProposalsConfig, input: ProposalInput): Promise<ProposalResponse> {
  // 1) bot check first: a failed token consumes no quota
  if (!deps.turnstile) throw new HttpError(503, 'service_unavailable', 'Bot check is not configured');
  const verdict = await deps.turnstile.verify(input.turnstileToken, input.ip, ['proposal']);
  if (verdict === 'unavailable') throw new HttpError(503, 'service_unavailable', 'Bot check unavailable');
  if (verdict === 'failed') throw new HttpError(403, 'bot_check_failed', 'Bot check failed');

  // 2) daily quotas: per IP, then global
  const day = dayKey(deps);
  const ipHash = await hashIp(input.ip, config.serverKey);
  if (!(await checkQuota(deps, 'proposals', `proposals:${day}:ip:${ipHash}`, config.limitIp, DAY_SECONDS))) {
    throw new HttpError(429, 'quota_exceeded', 'Daily limit reached', { headers: { 'Retry-After': '3600' } });
  }
  if (!(await checkQuota(deps, 'proposals', `proposals:${day}:all`, config.limitAll, DAY_SECONDS))) {
    await alertOnce(deps, `proposals:${day}:all:alert`, 'Generador de propuestas: tope diario global alcanzado.');
    throw new HttpError(429, 'quota_exceeded', 'Daily limit reached', { headers: { 'Retry-After': '3600' } });
  }

  // 3) model, with the rules as the net
  const modelOutput = await askModel(deps, input);
  const rules = classifyByRules(input.answers);
  const source = modelOutput ? 'ai' : 'rules';
  const packCode: ProposalPackCode = modelOutput?.pack ?? rules.pack;
  const extras: ExtraCode[] = [...new Set([...(modelOutput?.extras ?? []), ...rules.extras])].slice(0, 3);
  const texts = modelOutput ?? rulesTexts(packCode, input.locale);

  // 4) the price is always the rules' (never the model's)
  const price = priceForProposal(packCode, extras);
  const isApp = packCode.startsWith('APP_');
  const proposalId = crypto.randomUUID();
  const summary = texts.summary;
  const scope = texts.scope;

  const proposalToken = config.serverKey
    ? await signProposalToken(config.serverKey, {
        v: 1,
        id: proposalId,
        pack: packCode,
        extras,
        priceFrom: price.priceFrom,
        isApp,
        pricingVersion: pricing.version,
        locale: input.locale,
        source,
        summary,
        scope,
        exp: Math.floor(deps.clock.now().getTime() / 1000) + PROPOSAL_TOKEN_TTL_SECONDS,
      })
    : undefined;

  return {
    proposalId,
    ...(proposalToken ? { proposalToken } : {}),
    pricingVersion: price.pricingVersion,
    pack: {
      code: packCode,
      name: price.pack.name[input.locale],
      price: price.pack.price,
      weeks: price.pack.weeks,
      includes: price.pack.includes[input.locale],
    },
    priceFrom: price.priceFrom,
    isApp,
    recommendedExtras: price.recommendedExtras.map((e) => ({
      code: e.code,
      label: e.label[input.locale],
      price: e.price,
      billing: e.billing,
    })),
    summary,
    scope,
    questions: texts.questions,
    source,
    disclaimer: DISCLAIMER[input.locale],
  };
}

/** One Telegram notice per `key` window (a day). Best effort: an alert never turns into an error for the visitor. */
export async function alertOnce(deps: Deps, key: string, text: string): Promise<void> {
  if (!deps.telegram) return;
  try {
    if (await checkQuota(deps, 'alerts', key, 1, DAY_SECONDS)) await deps.telegram.sendMessage(text);
  } catch {
    logEvent('alerts', 'telegram_failed');
  }
}
