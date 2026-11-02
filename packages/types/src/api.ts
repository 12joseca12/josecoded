import type { aiProposalSchema, envClientSchema, envServerSchema, pricingSchema } from './schemas';
import type { z } from 'zod';

// Process boundaries: web <-> gateway contracts (ai_proposal now; leads, affiliates and chat from
// tasks 3.7+) and the environment of apps/web.

// Ports of the gateway (working-agreements §17.1). The rest (LeadsRepo, Mailer, ...) arrive with the task that
// introduces each adapter. `SupabaseGateway` lives next to its adapter (apps/api/src/adapters/supabase.ts)
// because it hands out the typed supabase-js client, which this package does not depend on.
export interface Clock {
  now(): Date;
}

/** One row of `private.scheduled_jobs` (created by migration 1.8): the single five-minute cron dispatches over it. */
export interface ScheduledJob {
  name: string;
  /** 5-field cron expression, evaluated in `tz`. */
  cron: string;
  /** IANA time zone; UTC when absent (`radar.daily` runs in Europe/Madrid). */
  tz?: string;
  nextRunAt: Date;
}

export interface ScheduledJobsRepo {
  /** Enabled jobs with `nextRunAt <= now`, oldest first (ties by name). */
  listDue(now: Date): Promise<ScheduledJob[]>;
  /** Records a run and when the job is due next. */
  markRan(name: string, ranAt: Date, nextRunAt: Date): Promise<void>;
  /**
   * Sets `enabled = false`: used when the row's cron or tz cannot produce a next run (a typo in the seed), so the
   * job is not retried every tick. Someone fixes the row and re-enables it by hand.
   */
  disable(name: string, reason: string): Promise<void>;
}

/**
 * A browser session verified against Supabase Auth (`/auth/v1/user`). `aal` comes from the claims of that same
 * JWT, trusted once Auth has accepted it: `aal2` means the session passed a second factor (TOTP, DATOS Q3).
 */
export interface AuthUser {
  id: string;
  email: string | null;
  aal: 'aal1' | 'aal2' | null;
}

/** Events written to `private.outbox` by triggers and RPCs (DATOS §4.7, §8.4). Others may appear later. */
export type OutboxEventName =
  | 'lead.created'
  | 'comment.pending'
  | 'asset.uploaded'
  | 'upgrade.requested'
  | 'chat.visitor_message'
  | 'system.outbox_dead';

/** One claimed row of `private.outbox` (`public.outbox_claim`). `attempts` already counts this claim. */
export interface OutboxEvent {
  id: number;
  /** An `OutboxEventName`, or an event a newer migration added (delivered with a generic text). */
  event: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: Date;
}

/**
 * The outbox RPCs of migration 20261028100000_base.sql (service role only). Dead-lettering is done in SQL: an
 * event whose 10th attempt fails (or whose 10th claim is abandoned) gets `dead_at` once and enqueues
 * `system.outbox_dead`, which the next drain delivers like any other event.
 */
export interface OutboxRepo {
  /** Claims up to `limit` (1..200) live events for `worker` and counts the attempt. */
  claim(limit: number, worker: string): Promise<OutboxEvent[]>;
  /** Marks delivered the events `worker` holds; returns how many changed. */
  ack(ids: number[], worker: string): Promise<number>;
  /** Records a failed delivery and releases the claim; `false` when `worker` does not hold the event. */
  fail(id: number, worker: string, error: string): Promise<boolean>;
}

/**
 * Once-only marks for notices that can leave from two places: the request that created the event (`POST /leads`,
 * the chat) notifies at once, and the outbox keeps the same event as an idempotent backup keyed by `payload.id`.
 */
export interface NoticeLedger {
  /** Records that the notice `key` was sent. */
  markSent(key: string): Promise<void>;
  /** `true` when the notice `key` was already sent, so the caller must not send it again. */
  wasSent(key: string): Promise<boolean>;
}

/** Jose's Telegram (bot `TELEGRAM_BOT_TOKEN`, chat `TELEGRAM_ADMIN_CHAT_ID`). Plain text, no parse mode. */
export interface Notifier {
  sendMessage(text: string): Promise<void>;
}

/**
 * The price catalogue the gateway prices with (plan 3.7b, D54): the PUBLISHED one (`pricing_published()`), the same that
 * the live site shows, never the draft the admin is editing. Cached in the isolate for five minutes; when the database
 * cannot answer it is the catalogue compiled from `content/pricing.json`. Callers read it once per request.
 */
export interface PricingSource {
  get(): Promise<z.infer<typeof pricingSchema>>;
}

export type AiProposal = z.infer<typeof aiProposalSchema>;
export type EnvClient = z.infer<typeof envClientSchema>;
export type EnvServer = z.infer<typeof envServerSchema>;
